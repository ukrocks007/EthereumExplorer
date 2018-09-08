process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();


chai.use(chaiHttp);
describe('/GET account transfer txn info', () => {
    it('it should GET all the books', (done) => {
        chai.request(server)
            .get('/eth/api/v1/transaction/0xbeae83e379e9a4c986cfc453fe90e1fa2ca50eaa692d99abe2aee2214208132')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
});