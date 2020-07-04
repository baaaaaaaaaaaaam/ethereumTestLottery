const Lottery= artifacts.require("Lottery")
const assertRevert = require('./asserRevert');
const expectEvent = require('./expectEvent');
const { assert } = require('chai');



contract('Lottery', function([deployer, user1, user2]){
    let lottery;
    let betAmount = 5000000000000000;
    let betAnoumtBN = new web3.utils.BN('5000000000000000');
    let bet_block_interval =3

    beforeEach(async () =>{
        console.log('before each')
        lottery= await Lottery.new();
    })

    it('getPot shoudl return current pot', async()=>{
        let pot=await lottery.getPot();
        assert.equal(pot,0);
    })

    describe('Bet', function(){
        it('should fail when the bet money is not 0.005 ETH', async()=>{
            // Fail transaction
            await assertRevert('0xab',{from : user1, value:4000000000000000})
            //  transaction object { chainId, value , to , from , gas(Limt) , gasPrice}
        
        })
        it('should put the bet to the bet queue with  1 bet', async()=>{
            //bet
            let receipt = await lottery.bet('0xab',{from : user1, value:5000000000000000})
            // console.log(receipt);

            let pot= await lottery.getPot();
            assert.equal(pot,0);
            //check contract balance==0.005
            let contractBalance = await web3.eth.getBalance(lottery.address);
            assert.equal(contractBalance, 5000000000000000);
            //check bet info
            let currentBlockNumber = await web3.eth.getBlockNumber();

            let bet= await lottery.getBetInfo(0);
            assert.equal(bet.answerBlockNumber, currentBlockNumber + bet_block_interval);
            assert.equal(bet.bettor, user1);
            assert.equal(bet.challenges, '0xab');
            // check log


            // console.log(receipt);
            await expectEvent.inLogs(receipt.logs,'BET');
    
        })
    })

    describe('Distribute', function(){
        describe('When the answer is checkable',function(){
            it.only('should give the user the pot when the answer matches',async()=>{
                // 두글자 다 맞았을 때

                // 정답 셋팅
                await lottery.setAnswerForTest('0xab08dbf8d2d5a8927ce7f892c242b68efd2eabea4265ba9e4bd068293d21f91a',{from:deployer})
                // 정답 시도 하드 코딩

                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});  //1
                await lottery.betAndDistribute('0xee',{from:user2, value:betAmount});  //2
                await lottery.betAndDistribute('0xab',{from:user1, value:betAmount});  //3 
                await lottery.betAndDistribute('0xfe',{from:user2, value:betAmount});  //4
                await lottery.betAndDistribute('0xff',{from:user2, value:betAmount});  //5
                await lottery.betAndDistribute('0xcc',{from:user2, value:betAmount});  //6

                
                let potBefore = await lottery.getPot(); //== 0.01 ETH  현재까지 1,2번 블록에서 시도한 테스트가 5번 6번 블록에서 검증되었고 결과가  fail이여서 베팅금액이 총 상금에 추가되어있다
                let user1BalanceBefore = await web3.eth.getBalance(user1);  //  == 정답을 맞추기전 user1의 잔고
                let receipt7 = await lottery.betAndDistribute('0xdc',{from:user2, value:betAmount});        //7 번블록이 생성되고 정답을 맞춘 값을 receipt7에 넣는다
                let potAfter = await lottery.getPot(); // ==7번 블록이 생성되면서 3번에서 배팅을한 유저가 보상금을 받아감으로써 lottery의 잔고가 0이될것이다
                let user1BalanceAfter = await web3.eth.getBalance(user1);   //  == 정답을 맞추고난 후 user1의 잔고



                assert.equal(potBefore.toString(),new web3.utils.BN('10000000000000000').toString());                
                assert.equal(potAfter.toString(),new web3.utils.BN('0').toString());

                user1BalanceBefore=new web3.utils.BN(user1BalanceBefore);

                // user1의 이전 잔고 + 이전까지 상금 + 베팅한 값 == 유저가 2개를 맞춰 획득한 잔고 + 유저의 잔고 
                assert.equal(user1BalanceBefore.add(potBefore).add(betAnoumtBN).toString(),new web3.utils.BN(user1BalanceAfter).toString());

            })
            it('should give the user the amount he or she bet when a single character matches',async()=>{
                // 한 글자 맞았을 때

                // 정답 셋팅
                await lottery.setAnswerForTest('0xab08dbf8d2d5a8927ce7f892c242b68efd2eabea4265ba9e4bd068293d21f91a',{from:deployer})
                // 정답 시도 하드 코딩

                await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});  //1
                await lottery.betAndDistribute('0xee',{from:user2, value:betAmount});  //2
                await lottery.betAndDistribute('0xac',{from:user1, value:betAmount});  //3 
                await lottery.betAndDistribute('0xfe',{from:user2, value:betAmount});  //4
                await lottery.betAndDistribute('0xff',{from:user2, value:betAmount});  //5
                await lottery.betAndDistribute('0xcc',{from:user2, value:betAmount});  //6

                
                let potBefore = await lottery.getPot(); //== 0.01 ETH  현재까지 1,2번 블록에서 시도한 테스트가 5번 6번 블록에서 검증되었고 결과가  fail이여서 베팅금액이 총 상금에 추가되어있다
                let user1BalanceBefore = await web3.eth.getBalance(user1);  //  == 정답을 맞추기전 user1의 잔고
                let receipt7 = await lottery.betAndDistribute('0xdc',{from:user2, value:betAmount});        //7 번블록이 생성되고 정답을 맞춘 값을 receipt7에 넣는다
                let potAfter = await lottery.getPot(); // ==7번 블록이 생성되면서 3번에서 배팅을한 유저가 보상금을 받아감으로써 lottery의 잔고가 0이될것이다
                let user1BalanceAfter = await web3.eth.getBalance(user1);   //  == 정답을 맞추고난 후 user1의 잔고



                assert.equal(potBefore.toString(),potAfter.toString());               

                user1BalanceBefore=new web3.utils.BN(user1BalanceBefore);

                  // user1의 이전 잔고 +  베팅한 값 == 유저가 2개를 맞춰 획득한 잔고 + 유저의 잔고 
                assert.equal(user1BalanceBefore.add(betAnoumtBN).toString(),new web3.utils.BN(user1BalanceAfter).toString());
            })
            it('should get the eth of user when the answer does not match at all',async()=>{
                // 다 틀렸을 때


                 // 정답 셋팅
                 await lottery.setAnswerForTest('0xab08dbf8d2d5a8927ce7f892c242b68efd2eabea4265ba9e4bd068293d21f91a',{from:deployer})
                 // 정답 시도 하드 코딩
 
                 await lottery.betAndDistribute('0xef',{from:user2, value:betAmount});  //1
                 await lottery.betAndDistribute('0xee',{from:user2, value:betAmount});  //2
                 await lottery.betAndDistribute('0xcc',{from:user1, value:betAmount});  //3 
                 await lottery.betAndDistribute('0xfe',{from:user2, value:betAmount});  //4
                 await lottery.betAndDistribute('0xff',{from:user2, value:betAmount});  //5
                 await lottery.betAndDistribute('0xcc',{from:user2, value:betAmount});  //6
 
                 
                 let potBefore = await lottery.getPot(); //== 0.01 ETH  현재까지 1,2번 블록에서 시도한 테스트가 5번 6번 블록에서 검증되었고 결과가  fail이여서 베팅금액이 총 상금에 추가되어있다
                 let user1BalanceBefore = await web3.eth.getBalance(user1);  //  == 정답을 맞추기전 user1의 잔고
                 let receipt7 = await lottery.betAndDistribute('0xdc',{from:user2, value:betAmount});        //7 번블록이 생성되고 정답을 맞춘 값을 receipt7에 넣는다
                 let potAfter = await lottery.getPot(); // ==7번 블록이 생성되면서 3번에서 배팅을한 유저가 보상금을 받아감으로써 lottery의 잔고가 0이될것이다
                 let user1BalanceAfter = await web3.eth.getBalance(user1);   //  == 정답을 맞추고난 후 user1의 잔고
 
 
 
                 assert.equal(potBefore.toString(),potAfter.add(betAnoumtBN));               
 
                 user1BalanceBefore=new web3.utils.BN(user1BalanceBefore);
 
                   // user1의 이전 잔고 +  베팅한 값 == 유저가 2개를 맞춰 획득한 잔고 + 유저의 잔고 
                 assert.equal(user1BalanceBefore.toString(),new web3.utils.BN(user1BalanceAfter).toString());
            })

        })
        describe('When the answer is not revealed(not minded)',function(){
            
        })
        describe('When the answer is not revealed(Block limit is passed)',function(){
            
        })
    })

    describe('isMatch', function(){

        let blockHash ='0xab08dbf8d2d5a8927ce7f892c242b68efd2eabea4265ba9e4bd068293d21f91a';
        it('should be BettingResult.Win when two characters match', async()=>{
            let matchingResult=await lottery.isMatch('0xab',blockHash);
            assert.equal(matchingResult,1);
        })
        it('should be BettingResult.Fail when two characters match', async()=>{
            let matchingResult=await lottery.isMatch('0xcd',blockHash);
            assert.equal(matchingResult,0);
        })
        it('should be BettingResult.Draw when two characters match', async()=>{
            let matchingResult=await lottery.isMatch('0xaf',blockHash);
            assert.equal(matchingResult,2);

            matchingResult=await lottery.isMatch('0xfb',blockHash);
            assert.equal(matchingResult,2);
        })
    })

})