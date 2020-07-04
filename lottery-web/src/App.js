import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';




// 컨트랙트를 재배포 할경우 컨트랙트 address가  재생성되 변경 해주어야 한다
let lotteryAddress = '0x78d8e46FCC55CD6aAC05013a3C322449F65bA8D6';
let lotteryABI = [{ "constant": true, "inputs": [], "name": "answerForTest", "outputs": [{ "name": "", "type": "bytes32" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x84f7e4f0" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x8da5cb5b" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "BET", "type": "event", "signature": "0x100791de9f40bf2d56ffa6dc5597d2fd0b2703ea70bc7548cd74c04f5d215ab7" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "WIN", "type": "event", "signature": "0x8219079e2d6c1192fb0ff7f78e6faaf5528ad6687e69749205d87bd4b156912b" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "FAIL", "type": "event", "signature": "0x3b19d607433249d2ebc766ae82ca3848e9c064f1febb5147bc6e5b21d0adebc5" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answer", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "DRAW", "type": "event", "signature": "0x72ec2e949e4fad9380f9d5db3e2ed0e71cf22c51d8d66424508bdc761a3f4b0e" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "index", "type": "uint256" }, { "indexed": false, "name": "bettor", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }, { "indexed": false, "name": "challenges", "type": "bytes1" }, { "indexed": false, "name": "answerBlockNumber", "type": "uint256" }], "name": "REFUND", "type": "event", "signature": "0x59c0185881271a0f53d43e6ab9310091408f9e0ff9ae2512613de800f26b8de4" }, { "constant": true, "inputs": [], "name": "getPot", "outputs": [{ "name": "pot", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x403c9fa8" }, { "constant": false, "inputs": [{ "name": "challenges", "type": "bytes1" }], "name": "betAndDistribute", "outputs": [{ "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xe16ea857" }, { "constant": false, "inputs": [{ "name": "challenges", "type": "bytes1" }], "name": "bet", "outputs": [{ "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xf4b46f5b" }, { "constant": false, "inputs": [], "name": "distribute", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xe4fc6b6d" }, { "constant": false, "inputs": [{ "name": "answer", "type": "bytes32" }], "name": "setAnswerForTest", "outputs": [{ "name": "result", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x7009fa36" }, { "constant": true, "inputs": [{ "name": "challenges", "type": "bytes1" }, { "name": "answer", "type": "bytes32" }], "name": "isMatch", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "pure", "type": "function", "signature": "0x99a167d7" }, { "constant": true, "inputs": [{ "name": "index", "type": "uint256" }], "name": "getBetInfo", "outputs": [{ "name": "answerBlockNumber", "type": "uint256" }, { "name": "bettor", "type": "address" }, { "name": "challenges", "type": "bytes1" }], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x79141f80" }];


class App extends Component {

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

  async componentDidMount() {
    await this.initWeb3();
    await this.polData();

    // setInterval(this.polData,1000);
  }

  polData = async() =>{
    await this.getPot();
    await this.getBetEvent();
    await this.getWinEvent();
    await this.getFailEvent();
    this.makeFinalRecords();
  }
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


  // getPot() 실행하여 현재 bet에 금액 얼만지 확인
  // 이후 DidMount 에서 interval로 주기적으로 불러올 예정
  getPot = async()=>{
    let pot = await this.lotteryContract.methods.getPot().call();
    let potString = this.web3.utils.fromWei(pot.toString(),'ether');
    this.setState({pot:potString});
  }



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
        records[i].answer='Not Revealed';
      }
    }
    // console.log(records);
    this.setState({fianlRecords:records})
  }

  getBetEvent = async () => {
    const records = [];
    let betEvent = await this.lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });
    
    for(let i=0;i<betEvent.length;i+=1){
      const record = {}
      record.index=parseInt(betEvent[i].returnValues.index,10).toString();
      record.bettor=betEvent[i].returnValues.bettor;
      record.betBlockNumber = betEvent[i].blockNumber;
      record.targetBlockNumber=betEvent[i].returnValues.answerBlockNumber.toString();
      record.challenges=betEvent[i].returnValues.challenges;
      record.win='Not Revealed';
      record.answer='0x0a';
      records.unshift(record);
    }

    this.setState({betRecords:records})
  }
  getWinEvent = async () => {
    const records = [];
    let betEvent = await this.lotteryContract.getPastEvents('WIN', { fromBlock: 0, toBlock: 'latest' });
    
    for(let i=0;i<betEvent.length;i+=1){
      const record = {}
      record.index=parseInt(betEvent[i].returnValues.index,10).toString();
      record.amount=parseInt(betEvent[i].returnValues.amount,10).toString();
      records.unshift(record);
    }
    console.log(records);
    this.setState({winRecords:records})
  }

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
 

  bet = async () => {
    //nonce 특정 address가 몇개의 트랜잭션을 만들엇는지의 값 , 트랜재션 리플레이 방지 , 외부 유저가 마음대로 사용못하게 방지

    let challenges = '0x' + this.state.challenges[0].toLowerCase() + this.state.challenges[1].toLowerCase();
    // let nonce = await this.web3.eth.getTransactionCount(this.account);
    this.lotteryContract.methods.betAndDistribute(challenges).send({ from: this.accounts, value: 5000000000000000, gas: 300000})
    .on('transactionHash',(hash)=>{
      console.log(hash)
    })

  }


  // pot money

  // bet 글자 선택 UI

  //  bet button

  // history table   
  // colum : index , address , challenge , answer ,pot ,status ,answerBlockNumber 
  onClickCard = (_Character) =>{
    this.setState({
      challenges:[this.state.challenges[1],_Character]
    })
  }

  getCard = (_Character, _cardStyle) => {

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
}


export default App;

