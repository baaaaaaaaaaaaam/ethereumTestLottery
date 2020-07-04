
// 에러가 발생할경우 해당 에러에 revert가있는 검사하여 처리해주는 방식


module.exports=async(promise)=> {
    try{
        await promise;
        assert.fail('Expected revert not received');
    }catch (error){
        const revertFound=error.message.search('revert')>=0;
        
        assert(revertFound, 'Expected "revert", got %s instead',error);
    }
}