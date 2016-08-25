function runTests(){
    try {
        tests.forEach(function(test){
            console.log('Running '+test.name);
            test.cases.forEach(function(c){
                console.log('Case: '+c.name);
                var result = c.run();
                console.log('- expected:')
                console.log(result.expected)
                console.log('- returned:')
                console.log(result.returned)
                if(result.expected === result.returned){
                    console.log('= Passed!');
                } else {
                    console.log('= Failed!');
                    throw result;
                }
            });
        });
        return true;
    } catch(result){
        console.log(result);
        return false;
    }
}
var TestException = {};

var tests = [
    {
        name: 'getPriceModifier',
        cases: [
            {
                name: 'amount: 0, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(0, 250))
                    return {expected: 2, returned: returned};
                }
            },
            {
                name: 'amount: 200, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(200, 250))
                    return {expected: 1.59, returned: returned};
                }
            },
            {
                name: 'amount: 1250, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(1250, 250))
                    return {expected: 1, returned: returned};
                }
            },
            {
                name: 'amount: 3000, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(3000, 250))
                    return {expected: 0.66, returned: returned};
                }
            },
            {
                name: 'amount: 10000, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(10000, 250))
                    return {expected: 0.5, returned: returned};
                }
            },
        ]
    },
];