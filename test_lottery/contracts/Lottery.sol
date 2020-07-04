// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

contract Lottery {

    struct BetInfo{
        //맞추려는 정답 블록
        uint256 answerBlockNumber;
        //정답을 맞춘경우 돈을 받는사람 반드시 payable 이있어야 돈을 보낼수있다
        address payable bettor;
       
        //맞추려는 블록해쉬 정답 값
         byte challenges;
    }


    address payable public owner;
     //  도박에 받을 돈
    uint256 private _pot;
    bool private mode =true ; //false == test mode ,true == real block hash use;
    bytes32 public answerForTest;

    // 도박에 사용되는 고정된 값
    uint256 constant internal BET_AMOUNT = 5000000000000000;
    // 몇번째 블록에있는 값을 확인할 것인지
    uint256 constant internal BET_BLOCK_INTERVAL =3;
    // 확인가능한 블록수
    uint256 constant internal BLOCK_LIMIT=256;

    enum BlockStatus {checkable,NotRevealed,BlockLimitPassed}
    enum BettingResult {Fail,Win,Draw}
    // 블록 선형 큐 
    uint256 private _tail;
    uint256 private _head;
    mapping(uint256=>BetInfo) private _bets;


    constructor() public{
        owner=msg.sender;
    }

// event log
  event BET(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);
  event WIN(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event FAIL(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event DRAW(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event REFUND(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);
// 스마트 컨트랙트에 들어있는 변수를가져오려면 view가 들어가야한다
// 해당 값을 불러오는  getter
    function getPot() public view returns (uint256 pot){
        return _pot;
    }



    // bet and distribute
    /*
    *@dev 베팅과 정답을 체크 한다. 유저는 0.005  ETH를 보내야 하고 , 베팅용 1byte 글자를 보낸다.
    *큐에 저장된 배팅 정본는 이후 distribute 함수에서 해결된다
    *@param challenges 유저가 베팅하는 글자
    *@return 함수가 잘 수행되었는지 확인하는 bool 값
     */
    function betAndDistribute (byte challenges) public payable returns (bool result ){
        bet(challenges);
        distribute();
        return true;
    }
    
    /*
    *@dev 베팅을 한다. 유저는 0.005  ETH를 보내야 하고 , 베팅용 1byte 글자를 보낸다.
    *뷰에 저장된 배팅 정본는 이후 distribute 함수에서 해결된다
    *@param challenges 유저가 베팅하는 글자
    *@return 함수가 잘 수행되었는지 확인하는 bool 값
     */

    // Betting
    function bet(byte challenges) public payable returns (bool result){
        // check the proper ether is sent

        // require 은 인수가 false로 평가되면 트랜잭션을 종료하고 ether balance를 되돌린다.
        // 보낸 금액과 요구조건 ( 0.005 eth) 가 맞는지 확인함
        require(msg.value==BET_AMOUNT, "Not enough ETH");

        // push bet to the queue
        // 블록을에 담을 내용을 저장한다.
        require(pushBet(challenges), "Fail to add a new Bet Info");
        // emit event
        emit BET(_tail -1, msg.sender, msg.value, challenges, block.number+ BET_BLOCK_INTERVAL);

        return true;
    }
        //save the bet to the queue



    // Distribute 검증



  /*
    *@dev 베팅 결과값으 ㄹ확인하고 팟머니를 분배한다
    *정답 실패 : 팟머니 축적, 정답 맞춤 : 팟머니 획득, 한글자 맞추거나 정답을 확인 불가능할 경우 베팅 금액만 돌려받는다
     */
    function distribute() public {
        // head 3 4 5 6 7 8 tail
        // 3번부터 만들어지고있는 블록 전까지 확인해야한다.
        // 만약 확인해야하 하는 블럭이 256 이상일때 확인못한 블록의 배팅값은 돌려준다
        
        // 현재 블록 변수
        uint256 cur;
        uint256 transferAmount;
        BetInfo memory b;
        BlockStatus currentBlockStatus;
        BettingResult currentBettingResult;

        for(cur=_head;cur<_tail;cur++){
            b=_bets[cur];
            currentBlockStatus = getBlockStatus(b.answerBlockNumber);
            // checkable : block.number> answerBlockNumber && block.number -BLOCK_LMIT < answerBlockNumber  확인가능한 경우
            if(currentBlockStatus==BlockStatus.checkable){
             
                bytes32 answerBlockHash = getAnswerBlockHash(b.answerBlockNumber);
            //  currentBettingResult 
             currentBettingResult=isMatch(b.challenges,answerBlockHash);
                // 두개다 맞췄을경우 bettor gets pot
                 if(currentBettingResult==BettingResult.Win){
                        //transper pot
                        transferAmount= transferAfterPayingFee(b.bettor,_pot+BET_AMOUNT);
                        //pot =0
                        _pot=0;
                        //emit Win
                        emit WIN(cur,b.bettor,transferAmount,b.challenges,answerBlockHash[0],b.answerBlockNumber);
                 }


               
                // 틀릴경우bettor's moeny goes pot
                if(currentBettingResult==BettingResult.Fail){
                     //pot = pot+BET_AMOUNT
                     _pot+=BET_AMOUNT;
                     //emit Fail
                     emit FAIL(cur,b.bettor,0,b.challenges,answerBlockHash[0],b.answerBlockNumber);
                 }


                //글자를 하나만 맞출경우  draw
                if(currentBettingResult==BettingResult.Draw){
                     //transfer only BET_AMOUNT
                     transferAmount= transferAfterPayingFee(b.bettor,BET_AMOUNT);
                     //emit Draw
                        emit WIN(cur,b.bettor,transferAmount,b.challenges,answerBlockHash[0],b.answerBlockNumber);
                 }

            }
            // Not Revealed : block.number <= answerBlockNumber  만들어지고있는 블락일경우
        if(currentBlockStatus==BlockStatus.NotRevealed){
                break;
            }
            // Block Limit Passed : block.number >=answerBlockNumber + BLOCK_LIMIT
        if(currentBlockStatus==BlockStatus.BlockLimitPassed){
                //refund
                transferAmount=transferAfterPayingFee(b.bettor, BET_AMOUNT);
                //emit refund
                emit REFUND(cur,b.bettor, transferAmount,b.challenges, b.answerBlockNumber);
            }
            popBet(cur);
        }
        _head=cur;
    }

// 도박에대한 수수료
function transferAfterPayingFee(address payable addr, uint256 amount) internal returns(uint256){
    uint256 fee = 0;
    uint256 amountWithoutFee = amount-fee;
    addr.transfer(amountWithoutFee);
    owner.transfer(fee);

// 스마트 컨트랙트에서 돈을 전송하는 3가지 방법 
// call,send,transfer
// transfer : ether전송 하는데 실패하면 트랜잭션 자체를  fail 시킴
// send : 보내긴하는데 try catch 사용할수잇다
//call : 이더 전송 뿐아니라 다른 스마트컨트랙트에 function호출도 가능


    return amountWithoutFee;
}

// 테스트 모드일대 임시로 정답을 지정해주는 메소드
    function setAnswerForTest(bytes32 answer) public returns (bool result){
        
        require(msg.sender ==owner, "Only owner can set the answer for test mode");

        answerForTest= answer;
        return true;
    }

// 현재 테스트 모드인지 리얼 블록해쉬값을 가져올건지 확인하는 메소드
    function getAnswerBlockHash(uint256 answerBlockNumber) internal view returns( bytes32 answer){
        return mode ? blockhash(answerBlockNumber) : answerForTest; 
    }


    /*
    @dev 베팅글자와 정답을 확인한다.
    @param challenges 베팅 글자
    @param answer 블록해쉬
    @return 정답결과
    */

// 블록 맞춘 상태 
    function isMatch(byte challenges,bytes32 answer) public pure returns (BettingResult){

        // challenges 0xab
        // answer 0xab..... 32bytes
        //  challenges에서 첫번째 글자와 두번째 글자를 추출하고 , answer에서 첫번째 글자와 두번째 글자를 추출하여 비교한다

        byte c1= challenges;
        byte c2= challenges;

        byte a1=answer[0];
        byte a2=answer[0];

        // get first number
        c1=c1>>4;    // 0xab -> 0x0a
        c1=c1<<4;    //0x0a -> 0xa0

        a1=a1>>4;
        a1=a1<<4;

        // get second number

        c2=c2<<4;
        c2=c2>>4;

        a2=a2<<4;
        a2=a2>>4;


        if(a1==c1&&a2==c2){
            return BettingResult.Win;
        }

        if(a1==c1 || a2 == c2){
            return BettingResult.Draw;
        }
        return BettingResult.Fail;

    }

// 블록 상태 
    function getBlockStatus(uint256 answerBlockNumber) internal view returns (BlockStatus){
        if(block.number> answerBlockNumber && block.number < BLOCK_LIMIT + answerBlockNumber){
                return BlockStatus.checkable;
        }
        if(block.number <= answerBlockNumber){
                return BlockStatus.NotRevealed;
        }
        if(block.number >=answerBlockNumber + BLOCK_LIMIT){
            return BlockStatus.BlockLimitPassed;
        }
       return BlockStatus.BlockLimitPassed;
    }

        // check the answer

    function getBetInfo(uint256 index) public view returns (uint256 answerBlockNumber, address bettor, byte challenges){
        BetInfo memory b = _bets[index];
        answerBlockNumber=b.answerBlockNumber;
        bettor = b.bettor;
        challenges= b.challenges;
    }

    function pushBet(byte challenges) internal returns (bool){

        // 저장하려는 블록의 내용 , b 라고 선언함
        BetInfo memory b;
        //msg.sender는 해당 트랜잭션을 보낸 유저의 어드레스를 받아서 사용할수 있다
        // 블록에 저장하는 bettor라는 변수에 트랜젝션을 발생시킨 사람의 주소를 담는다.
        b.bettor=msg.sender;  // address  이므로 20byte


        // block.number는 해당 트랜잭션이 들어가는 블록의 넘버를 알수 있다
        // 현재 블록 넘버 + 3 한 값을 저장한다
        b.answerBlockNumber=block.number + BET_BLOCK_INTERVAL;  //unit256 이므로 32 byte


        // 맞추려는 정답을 블록에 저장한다 
        b.challenges=challenges;   // byte 타입이므로 1 byte  

        // _bets에 블록을 저장한다.
        _bets[_tail]=b;


        //  tail의 값을 늘린다.
        _tail++;  // 32byte  ==20000gas


        return true;
    }

    function popBet(uint256 index) internal returns (bool){
        delete _bets[index];
        return true;
    }
}