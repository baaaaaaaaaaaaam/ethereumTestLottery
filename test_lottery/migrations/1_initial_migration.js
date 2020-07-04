const Migrations = artifacts.require("Migrations");
//build 폴더에있는 Migration 가져온다

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  //가져온 Migrations 을 deployer가 배포한다
};
