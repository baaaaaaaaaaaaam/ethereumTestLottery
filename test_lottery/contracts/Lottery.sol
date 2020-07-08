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

    // 돈을 받는 사람
    address payable public owner;
     //  도박에 받을 돈
    uint256 private _pot;

    // 정답을 고정으로 할것인지 아니면 블록해쉬의 값을 받아올건지
    bool private mode =true ; //false == test mode ,true == real block hash use;

    //  ??
    bytes32 public answerForTest;

    // 도박에 사용되는 고정된 값
    uint256 constant internal BET_AMOUNT = 5000000000000000;
    // 몇번째 블록에있는 값을 확인할 것인지
    uint256 constant internal BET_BLOCK_INTERVAL =3;
    // 확인가능한 블록수
    uint256 constant internal BLOCK_LIMIT=256;

    enum BlockStatus {checkable,NotRevealed,BlockLimitPassed}
    enum BettingResult {Fail,Win,Draw}


    // 컨트랙트에서 자신에게 발생한 블록을 저장할 큐 
    uint256 private _tail;
    uint256 private _head;

    // 문법 이해안됨
    mapping(uint256=>BetInfo) private _bets;


    constructor() public{
        owner=msg.sender;
    }

// 이벤트 로그 부분
  event BET(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);
  event WIN(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event FAIL(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event DRAW(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  event REFUND(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);


// 스마트 컨트랙트에 들어있는 변수를가져오려면 view가 들어가야한다
// 현재 컨트랙트안에 저장되어있는  _pot값
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

    // 실제로 dapp에서 실행시키려는 부분 


// betAndDistribute는 정답을 입력하고 확인하는 코드이다 
// 1. Dapp 에서 맞추려는 정답값을 betAndDistribute(challenges)에 포함시켜 send 를 한다
// 2. betAndDistribute는 유저가 베팅하는 돈, 보낸사람, 트랜잭션이 담긴 블록 정보, 베팅한 정답중 challenges만 받으면된다. 나머지 돈 , 보낸사람 현재 블록 정보 는 msg객체에서 가져올 수 있다.
// 3. challenges를 bet(challenges) 로 실행한다.
// 3. require을 사용하여 베팅한 돈이 조건에 맞는지 확인한다
// 4. require을 사용하여 pushBet(challenges)를 호출한다 ==> 컨트렉트에 저장할 부분
// 5. pushBet에서 betInfo 라고 만든 constructor를 생성하여 값을 저장한다
// 6. 저장할 값은 msg.sender , 현재 블록 + 3 ( 정답을 맞출 블록 값 ) , challenges ( 내가 입력한 값 )
// 7. betInfo와 연결되어있는 _bet이라는 배열에 0번에 저장하고 +1 해준다  ( 변수 선언만하면 0으로 생성됨 )
// 8. 정보를 저장하면 emit 을 사용하여 이벤트로 남긴다.
// 9. 이벤트로 남긴 다음 전체 정답을 다시 확인한다.
// 10 . betInfo와 연결된 블록 스택을 불러옴
// 11.  첫 블록부터 스택끝까지 반복문으로 검사함
// 11-1. 현재 블록번호가 스택에있는 betInfo[i]의 answerBlock보다 큰 값인지 getBlockStatus() 통해 확인함
// 11-1-1 큰 경우 BlockStatus가 Checkable임으로 정답을 확인하는 절차를 진행함
// 11-1-2 getAnswerBlockHash() 통해 해당 블록의 Hash를 가져옴
// 11-1-3 불러온 해쉬를 isMatch에 대입하여 맞는지 맞지않는지 확인함 
// 11-1-3-0 정답이 맞는 경우 
// 11-1-3-1 누적상금과 , 베팅한 금액을 trasferAfterPayingFee 메소드의 addr.transfer을 통해 전달함
// 11-1-3-2 상금을 0으로 초기화함
// 11-1-3-3 이벤트를 남김
// 11-1-3-4 정답이 틀린 경우
// 11-1-3-5 베팅금액을 상금에 추가함
// 11-1-3-6 이벤트를 남김
// 11-1-4 popBet()을 호출하여 현재블록을 스택에서 delete 함 

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

        // pushBet에서 생성한 betInfo 객체 불러옴
        BetInfo memory b;

        // enum상태로 만들어논 blockStatus는 checkable , notRevealed,PassLimit가 존재한다.
        BlockStatus currentBlockStatus;

        BettingResult currentBettingResult;

        // 현재 _head (0) 부터 pushBet 에서 +1 한 값 ( _bet에 저장되어있는 블록의 갯수 만큼 반복함)
        for(cur=_head;cur<_tail;cur++){

            // 첫번째 블록을 불러옴
            b=_bets[cur];


            // 블록의 상태가 checkable인지 not Revealed인지 확인하는 절차로 블록의 정답을 확인할수 있는 상태인지 아닌지를 판단하는 부분이다
            // ex )block.number가 5 이고  정답을 확인할 블록이 4일때   4 < 5 < 260 인 경우 checkable 이다
            // ex )block.number가 4이고  정답을 확인할 블록이 4일때 NotRevealed 상태이다 

            currentBlockStatus = getBlockStatus(b.answerBlockNumber);


            // 블록 상태에따른 정답 맞추기 
            // 1.. 정답을 맞춰볼수있는 상태라면 
            if(currentBlockStatus==BlockStatus.checkable){
             
             // 맞추려는 정답을 불러오는 getAnswerBlockHash메소드에 현재 블록 넘버를 넣고 블록 해쉬의 값을 가져온다
             bytes32 answerBlockHash = getAnswerBlockHash(b.answerBlockNumber);


                // 정답이 맞는지 블록에 들어있는 입력한 값과 블록의 해쉬를 비교한다 
             currentBettingResult=isMatch(b.challenges,answerBlockHash);
                // 두개다 맞췄을경우 bettor gets pot
                 if(currentBettingResult==BettingResult.Win){
                        // 정답을 맞춘 유저에게 전달해야하는 돈 (누적상금 + 베팅한 금액 )
                        transferAmount= transferAfterPayingFee(b.bettor,_pot+BET_AMOUNT);
                        //누적상금을 초기화한다
                        _pot=0;
                        //이벤트를 남긴다.
                        //  현재 인덱스 , 베팅자 , 상금 ,입력한 값 , 정답 , 맞추려는 블록 번호 
                        // answerBlockHash[0] 의미 모르겟음 
                        emit WIN(cur,b.bettor,transferAmount,b.challenges,answerBlockHash[0],b.answerBlockNumber);
                 }
                // isMatch에서 정답이 틀린경우 bettingResult.Fail 임
                if(currentBettingResult==BettingResult.Fail){
                     //상금에 베팅금액을 추가함
                     _pot+=BET_AMOUNT;
                    //  이벤트를 남긴다
                    // 현재 인덱스 , 베팅자 , 상금 , 입력한 값 , 정답 , 맞추려는 블록 번호
                     emit FAIL(cur,b.bettor,0,b.challenges,answerBlockHash[0],b.answerBlockNumber);
                 }


                //글자를 하나만 맞출경우  draw
                if(currentBettingResult==BettingResult.Draw){
                     //transfer only BET_AMOUNT
                     transferAmount= transferAfterPayingFee(b.bettor,BET_AMOUNT);
                     //emit Draw
                        emit DRAW(cur,b.bettor,transferAmount,b.challenges,answerBlockHash[0],b.answerBlockNumber);
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

            // 블록을 저장한 배열에서 블록을 꺼낸다
            popBet(cur);
        }
        //검사할 블록 시작번호 변경 
        _head=cur;
    }

// 도박에대한 수수료
function transferAfterPayingFee(address payable addr, uint256 amount) internal returns(uint256){
    // amount는 상금
    uint256 fee = 0;
    uint256 amountWithoutFee = amount-fee;

    // 실제로 전송하는 부분
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
        // mode 가 True일때 실제 블록의 해쉬를가져오고 , false일때 지정해논 정답값을 사용한다 
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

// 블록의 상태를 판단하여 정답을 맞출수잇는 상태인지 아닌지를 확인한다 
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

// _bet에 연결된 블록을 삭제함
    function popBet(uint256 index) internal returns (bool){
        delete _bets[index];
        return true;
    }
}