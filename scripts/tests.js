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
                if(typeof(result.expected)=='object'){
                    drillObjects(result.expected, result.returned, function(compare1, compare2){
                        if(!compare1 === compare2){
                            console.log('= Failed!');
                            throw result;
                        }
                    });
                    console.log('= Passed!');
                } else {
                    if(result.expected === result.returned){
                        console.log('= Passed!');
                    } else {
                        console.log('= Failed!');
                        throw result;
                    }
                }
            });
        });
        return true;
    } catch(result){
        console.log(result);
        return false;
    }
}
function drillObjects(o1, o2, f){
    if(Object.keys(o1)){
        Object.keys(o1).forEach(function(k){
            drillObjects(o1[k], o2[k], f);
        });
    } else {
        f(o1, o2);
    }
}

var tests = [
    {
        name: 'getPriceModifier',
        cases: [
            {
                name: 'amount: 0, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(0, 250));
                    return {expected: 2, returned: returned};
                }
            },
            {
                name: 'amount: 200, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(200, 250));
                    return {expected: 1.59, returned: returned};
                }
            },
            {
                name: 'amount: 1250, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(1250, 250));
                    return {expected: 1, returned: returned};
                }
            },
            {
                name: 'amount: 3000, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(3000, 250));
                    return {expected: 0.66, returned: returned};
                }
            },
            {
                name: 'amount: 10000, required: 250',
                run: function(){
                    var returned = getMoney(getPriceModifier(10000, 250));
                    return {expected: 0.5, returned: returned};
                }
            },
        ]
    },
    {
        name: 'getCommodityPrice',
        cases: [
            {
                name: 'amount: 0, required: 250',
                run: function(){
                    var returned = getCommodityPrice(0, 250, 2);
                    return {expected: { modifier: 2, price: 4 }, returned: returned};
                }
            },
            {
                name: 'amount: 200, required: 250',
                run: function(){
                    var returned = getCommodityPrice(200, 250, 2);
                    return {expected: { modifier: 1.59, price: 3.18 }, returned: returned};
                }
            },
            {
                name: 'amount: 1250, required: 250',
                run: function(){
                    var returned = getCommodityPrice(1250, 250, 2);
                    return {expected: { modifier: 1, price: 2 }, returned: returned};
                }
            },
            {
                name: 'amount: 3000, required: 250',
                run: function(){
                    var returned = getCommodityPrice(3000, 250, 2);
                    return {expected: { modifier: 0.66, price: 1.32 }, returned: returned};
                }
            },
            {
                name: 'amount: 10000, required: 250',
                run: function(){
                    var returned = getCommodityPrice(10000, 250, 2);
                    return {expected: { modifier: 0.5, price: 1 }, returned: returned};
                }
            },
        ]
    },
];