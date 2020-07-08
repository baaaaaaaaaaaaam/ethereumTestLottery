import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';




// 컨트랙트를 재배포 할경우 컨트랙트 address가  재생성되 변경 해주어야 한다
let lotteryAddress = '0x1544fdEbb4B39BE507A925Bacf89A69c590947E4';
let lotteryABI = [{ "constant": true, "inputs": [], "name": "answerForTest", "outputs": [{ "name": "", "type": "bytes32" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x84f7e4f0" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x8da5cb5b" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "BET", "type": "event", "signature": "0x100791de9f40bf2d56ffa6dc5597d2fd0b2703ea70bc7548cd74c04f5d215ab7" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "WIN", "type": "event", "signature": "0x8219079e2d6c1192fb0ff7f78e6faaf5528ad6687e69749205d87bd4b156912b" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "FAIL", "type": "event", "signature": "0x3b19d607433249d2ebc766ae82ca3848e9c064f1febb5147bc6e5b21d0adebc5" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "DRAW", "type": "event", "signature": "0x72ec2e949e4fad9380f9d5db3e2ed0e71cf22c51d8d66424508bdc761a3f4b0e" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "REFUND", "type": "event", "signature": "0x59c0185881271a0f53d43e6ab9310091408f9e0ff9ae2512613de800f26b8de4" }, { "constant": true, "inputs": [], "name": "getPot", "outputs": [{ "name": "pot", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x403c9fa8" }, { "constant": false, "inputs": [{ "name": "challenges", "type": "bytes1" }], "name": "betAndDistribute", "outputs": [{ "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xe16ea857" }, { "constant": false, "inputs": [{ "name": "challenges", "type": "bytes1" }], "name": "bet", "outputs": [{ "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xf4b46f5b" }, { "constant": false, "inputs": [], "name": "distribute", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xe4fc6b6d" }, { "constant": false, "inputs": [{ "name": "answer", "type": "bytes32" }], "name": "setAnswerForTest", "outputs": [{ "name": "result", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x7009fa36" }, { "constant": true, "inputs": [{ "name": "challenges", "type": "bytes1" }, { "name": "answer", "type": "bytes32" }], "name": "isMatch", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "pure", "type": "function", "signature": "0x99a167d7" }, { "constant": true, "inputs": [{ "name": "index", "type": "uint256" }], "name": "getBetInfo", "outputs": [{ "name": "answerBlockNumber", "type": "uint256" }, { "name": "bettor", "type": "address" }, { "name": "challenges", "type": "bytes1" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x79141f80" }];


class App extends Component {


  // 객체 생성자 
  constructor(props) {
    super(props);

    this.state = {
      betRecords: [],
      winRecords: [],
      failRecords: [],
      pot: '0',
      challenges: ['A', 'B'],
      fianlRecords: [{
        bettor: '0bxabcd...',
        index: '0',
        challenges: 'ab',
        answer: 'ab',
        targetBlockNumber: '10',
        pot: '0'
      }]
    }
  }


  //웹실행시 비동기 방식으로 가장먼저 실행되는부분
  async componentDidMount() {
    await this.initWeb3();
    await this.polData();

    // setInterval(this.polData,1000);
  }


 // web3를 시작하여 metamast와 연결하는 부분 
 initWeb3 = async () => {
  if (window.ethereum) {
    this.web3 = new Web3(window.ethereum);
    try {
      // Request account access if needed
      window.ethereum.enable();
    } catch (error) {
      // User denied account access…
    }
  } else if (window.web3) {
    // Legacy dapp browsers…
    window.web3 = new Web3(window.web3.currentProvider);
  } else {
    // Non-dapp browsers…
    console.log(
      'Non-Ethereum browser detected. You should consider trying Status!'
    );
  }
  let accounts = await this.web3.eth.getAccounts();
  this.accounts = accounts[0];
  this.lotteryContract = new this.web3.eth.Contract(lotteryABI, lotteryAddress);


  // call 스마트컨트랙트의 값을 불러오기만함 / invoke , send 는 값을 입력할수잇음
 
  // let owner =await this.lotteryContract.methods.owner().call();
  // console.log(owner);
}

  polData = async() =>{
    //  실행시 컨트랙트가 저장하고있는 블록의 데이터를 불러오는 부분 !!!
    //  컨트랙트는 자신이 해당하는 정보의 블록을 Queue스택에 저장해 놓는다 
    await this.getPot();   // ==> 1
    await this.getBetEvent();  // ==> 2
    await this.getWinEvent();   // ==> 3 
    await this.getFailEvent();  // ==> 4
    this.makeFinalRecords();  // ==> 5
  }

  //  1.
  //  누적 상금인 bet의  금액 얼만지 확인
  // 이후 DidMount 에서 interval로 주기적으로 불러올 예정
  getPot = async()=>{
    let pot = await this.lotteryContract.methods.getPot().call();  //call 을하는 부분에서 트랜잭션 비용이 발생하지않는다 ! 정보를 받아올뿐 
    let potString = this.web3.utils.fromWei(pot.toString(),'ether');  // 받아온 pot 은 BN을 toString 으로 변환함, 단위는  ether단위로 
    this.setState({pot:potString});    // 불러온 값을 위에 state의 pot에 적용 한다.
  }


  // 2.Contract에 있는 BET 이벤트 
  // event BET(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);
  getBetEvent = async () => {

    // records라는 배열을 만든다 ( 어떤게 들어가는지 확인 필요 )
    const records = [];

    //contract 에 생성한 event중 'BET'이란 이름을 가진 로그를 처음부터 끝까지 불러와 betEvent에 담는다
    let betEvent = await this.lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });
    

    //가져온이벤트 배열을 처음부터 끝까지 돌린다
    for(let i=0;i<betEvent.length;i+=1){
      //  json형태의 record변수를 만든다.
      const record = {}

      // index정보를 가져오는데 인덱스의 숫자의 자리숫는 10자리까지 가능하다.
      record.index=parseInt(betEvent[i].returnValues.index,10).toString();

      // 이벤트 bettor에 있는 값
      record.bettor=betEvent[i].returnValues.bettor;

      // 이벤트 변수에는 없지만 해당 블록 넘버를 불러올수있음
      record.betBlockNumber = betEvent[i].blockNumber;

      // 이벤트에 적어둔 정답을 맞춰볼 블록 넘버
      record.targetBlockNumber=betEvent[i].returnValues.answerBlockNumber.toString();

      // 이벤트에 남겨둔 정답 시도 
      record.challenges=betEvent[i].returnValues.challenges;
      // 임의의 값
      record.win='a';
      // 임의의값
      record.answer='0x0a';

      // 역순으로 배열에 저장
      records.unshift(record);
    }

    this.setState({betRecords:records})
    console.log(records)
  }

  //3
  //  event WIN(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  getWinEvent = async () => {
    const records = [];
    let betEvent = await this.lotteryContract.getPastEvents('WIN', { fromBlock: 0, toBlock: 'latest' });
    
    for(let i=0;i<betEvent.length;i+=1){
      const record = {}
      record.index=parseInt(betEvent[i].returnValues.index,10).toString();
      record.amount=parseInt(betEvent[i].returnValues.amount,10).toString();
      records.unshift(record);
    }
    // console.log(records);
    this.setState({winRecords:records})
  }


  // 4
  // event FAIL(uint256 index, address bettor, uint256 amount, byte challenges,byte answer, uint256 answerBlockNumber);
  getFailEvent = async () => {
    const records = [];
    let betEvent = await this.lotteryContract.getPastEvents('FAIL', { fromBlock: 0, toBlock: 'latest' });
    
    for(let i=0;i<betEvent.length;i+=1){
      const record = {}
      record.index=parseInt(betEvent[i].returnValues.index,10).toString();
      record.answer=betEvent[i].returnValues.answer;
      records.unshift(record);
    }
    // console.log(records);
    this.setState({failRecords:records})
  }


  // 5
  // BET , WIN , FAIL 을 하나의 배열로 만듬 
  makeFinalRecords = () =>{
    let f=0 ,w =0 ;
    const records=[...this.state.betRecords];
    for(let i=0;i<this.state.betRecords.length;i+=1){
       
      if(this.state.winRecords.length>0 && this.state.betRecords[i].index===this.state.winRecords[w].index){
        records[i].win='WIN';
        records[i].answer=records[i].challenges;;
        records[i].pot=this.web3.utils.fromWei(this.state.winRecords[w].amount,'ether');
        if(this.state.winRecords.length-1>w)w++;

      }else if(this.state.failRecords.length>0 && this.state.betRecords[i].index===this.state.failRecords[f].index){
        records[i].win='FAIL';
        records[i].answer=this.state.failRecords[f].answer;
        records[i].pot=0;
        if(this.state.failRecords.length-1>f)f++;

      }else{
        // WIN도 아니고 FAIL도 아닌 DRAW 이거나 아직 처리가안됨경우 
        records[i].answer='Not Revealed';
      }
    }
    // console.log(records);
    this.setState({fianlRecords:records})
  }

 
 



  //  getCard에서 카드 이미지를 선택할 경우 카드이미지에 배정되어있는 문자를 state 의 challenges의 마지막 문자로 변경하고 기존의 문자를 앞의 문자로 변경시킨다
  //  ex )  orignal == ab   ,  세번째 이미지 ( 할당된 문자 c ) 클릭 후  bc로 변경됨
  onClickCard = (_Character) =>{
    this.setState({
      challenges:[this.state.challenges[1],_Character]
    })
  }


//  카드 이미지 부분 입력할 알파벳과 , 카드의 스타일 정함 

  getCard = (_Character, _cardStyle) => {

    // 빈 문자열 변수 만들고 조건에 따라 해당 문제가 들어올경우 이미지로 변경한다
    let _char = '';
    if(_Character==='a'){
      _char='🂡'
    }
    if(_Character==='b'){
      _char='🂱'
    }
    if(_Character==='c'){
      _char='🃁'
    }
    if(_Character==='d'){
      _char='🃑'
    }

    return (

      // 해당 카드 스타일을 클릭할경우 생성자에 있는 state.answer의 문자를 js로 변경한다.
      <button className={_cardStyle} onClick={() =>{
          this.onClickCard(_Character)
      }}>
        <div className="card-body text-center">
          <p className="card-text"></p>
          <p className="card-text text-center" style={{fontSize:100}}>{_char}</p>
          <p className="card-text"></p>
        </div>
      </button>
    )
  };







 



  render() {
    return (
      <div className="App">
        {/*Header - pot , betting charater */}
        <div className="contrainer">
          <div className="jumbotron">
            <h1>currnet Pot: {this.state.pot}</h1>
            <p>Lottery</p>
            <p>Lotteery tutorial</p>
            <p>Your Bet</p>
            <p>{this.state.challenges[0]} {this.state.challenges[1]}</p>
          </div>
        </div>
        <div className="container">
          <div className="card-group">
            {this.getCard('a', 'card bg-primary')}
            {this.getCard('b', 'card bg-warning')}
            {this.getCard('c', 'card bg-danger')}
            {this.getCard('d', 'card bg-primary')}
          </div>
        </div>
        <br></br>
        <div className="container">
          <button className="btn btn-danger btn-lg" onClick={this.bet}>BET!!!</button>
        </div>
        <br></br>
        <div className="container">
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Index</th>
                <th>Address</th>
                <th>Challenges</th>
                <th>Answer</th>
                <th>Pot</th>
                <th>Status</th>
                <th>answerBlockNumber</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.fianlRecords.map((record,index)=>{
                  return(
                    <tr key={index}>
                      <td>{record.index}</td>
                      <td>{record.bettor}</td>
                      <td>{record.challenges}</td>
                      <td>{record.answer}</td>
                      <td>{record.pot}</td>
                      <td>{record.win}</td>
                      <td>{record.targetBlockNumber}</td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

    );
  }


//트랜잭션 보내기 
bet = async () => {
  //nonce 특정 address가 몇개의 트랜잭션을 만들엇는지의 값 , 트랜재션 리플레이 방지 , 외부 유저가 마음대로 사용못하게 방지


  // 트랜잭션에 발송할 challenges 셋팅
  let challenges = '0x' + this.state.challenges[0].toLowerCase() + this.state.challenges[1].toLowerCase();
  // let nonce = await this.web3.eth.getTransactionCount(this.account);

  // 실제로 트랜션이 발생하는부분 !!!!!!!!!!!!!!!!!!!!!!
  this.lotteryContract.methods.betAndDistribute(challenges).send({ from: this.accounts, value: 5000000000000000, gas: 300000})
  .on('transactionHash',(hash)=>{
    console.log(hash)
  })

}


}


export default App;

