process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();


chai.use(chaiHttp);

describe('/GET to /', () => {
    it('should return 200 code', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
});

describe('/POST to /', () => {
    it('should return 500 code', (done) => {
        chai.request(server)
            .post('/')
            .end((err, res) => {
                res.should.have.status(500);
                done();
            });
    });
});

describe('/GET account transfer txn info', () => {
    it('should be a JSON', (done) => {
        chai.request(server)
            .get('/eth/api/v1/transaction/0x084011312ed8a7d88d2e78cd54f383163e8aa3d2dcf8d83f1ec948768a616212')
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
});

describe('/GET ERC20 token transfer txn info', () => {
    it('should be a JSON', (done) => {
        chai.request(server)
            .get('/eth/api/v1/transaction/0xee33a6c25198bf980c80803b25b30dbc195018d9ec9c97e087a9f1902ead45a9')
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
});

describe('/GET contract execution txn info', () => {
    it('should be a JSON', (done) => {
        chai.request(server)
            .get('/eth/api/v1/transaction/0xda207ae2980e09742ad28f2e604a964387df13afc8831c5762fc5b7b240b0502')
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
});

describe('/POST', () => {
    it('should return error code', (done) => {
        chai.request(server)
            .post('/eth/api/v1/transaction/')
            .end((err, res) => {
                res.should.have.status(500);
                done();
            });
    });
});