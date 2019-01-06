const RPCClient = require('pascalcoin/src/RPC/Client');
const Transaction = require('pascalcoin/src/Operation/Transaction');
const OperationsBuilder = require('pascalcoin/src/Operation/OperationsBuilder');
const KeyPair = require('pascalcoin/src/Keys/KeyPair');
const Currency = require('pascalcoin/src/Types/Currency');

// rpc client
const rpc = RPCClient.factory('http://127.0.0.1:4103');

// read config
const config = require(__dirname + '/config.js');

// create keypair to sign in node
const kp = KeyPair.fromEncryptedPrivateKey(config.key.pk, config.key.pw);

// create roundtable, A sends to B, B sends to C, C sends to A
let roundTable = {};
var counts = {};
for(var idx = 0; idx < config.accounts.length; idx++) {
    if(idx + 1 === config.accounts.length) {
        // last sends to first
        roundTable[config.accounts[idx]] = config.accounts[0];
    } else {
        roundTable[config.accounts[idx]] = config.accounts[idx + 1];
    }
    counts[config.accounts[idx]] = 0;
}

/**
 * Sends the transaction.
 *
 * @param sender
 * @param target
 * @returns {Promise<any | never>}
 */
function send(sender, target)
{
    return rpc.getAccount(sender).execute().then(senderObj => {
        let nop = senderObj.n_operation;
        const opBuilder = new OperationsBuilder();
        for (i = 1; i <= 3; i++) {
            const op = new Transaction(sender, target, new Currency(0.0001));
            op.withFee(new Currency(0.0001));
            op.withPayload('');
            nop++;
            op.sign(kp, nop);
            opBuilder.addOperation(op);
        }
        return rpc.executeOperations(opBuilder.build()).execute();
    });
}

// loop roundTable and start processing for each entry
Object.keys(roundTable).forEach((sender) => {
    setTimeout(() => processAction(parseInt(sender, 10), roundTable[sender]), 1);
});

var ldt = Math.floor(new Date().getTime() / 1000);
function processAction(sender, target)
{
    send(sender, target).then(r => {
        counts[sender] += r.length;

        // update screen every other second
        var ldt2 = Math.floor(new Date().getTime() / 1000);
        if (ldt2 > ldt) {
            ldt = ldt2;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            let ct = 0;
            Object.keys(roundTable).forEach((sender) => {
                process.stdout.write(`${sender} -> ${counts[sender]} | `);
                ct +=counts[sender];
            });

            process.stdout.write(` -> ${ct}`);
        }

        processAction(sender, target);
    });
}
