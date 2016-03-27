import chai from 'chai';
import chaiSpies from 'chai-spies';
chai.use(chaiSpies).should();
import fileSystem from 'fs-promise';
import repositoryQuestion from '../src/';
describe('repositoryQuestion', () => {

  it('returns an object with expected keys', () => {
    repositoryQuestion()
      .should.be.an('object')
      .with.keys([ 'name', 'message', 'when' ]);
  });

  describe('when function', () => {
    let whenFunction = null;
    let contents = null;
    beforeEach(() => {
      whenFunction = repositoryQuestion().when;
      contents = {
        '/foo/bar/package.json': '{"repository":"packagejsonbar"}',
        '/foo/bar/.git/config': '[remote "origin"]\nurl=gitconfigbar',
      };
      fileSystem.readFile = chai.spy((file) => contents[file]);
    });

    it('returns false if `repository` is in answers object', async function () {
      (await whenFunction({ repository: 'foo' }, '/foo/bar')).should.equal(false);
      fileSystem.readFile.should.not.have.been.called();
    });

    it('reads package.json if repository is not in answers', async function () {
      (await whenFunction({}, '/foo/bar'));
      fileSystem.readFile.should.have.been.called(1).with.exactly('/foo/bar/package.json', 'utf8');
    });

    it('returns false and mutates answers if `repository` is in package.json', async function () {
      const answers = {};
      (await whenFunction(answers, '/foo/bar')).should.equal(false);
      answers.should.have.property('repository', 'packagejsonbar');
    });

    it('reads .git/config if `repository` is not in package.json', async function () {
      const answers = {};
      contents['/foo/bar/package.json'] = '{}';
      (await whenFunction(answers, '/foo/bar')).should.equal(false);
      fileSystem.readFile.should.have.been.called(2)
        .with.exactly('/foo/bar/.git/config', 'utf8');
      answers.should.have.property('repository', 'gitconfigbar');
    });

    it('returns true if reading package.json and .git/config causes error', async function () {
      const answers = {};
      fileSystem.readFile = chai.spy(() => {
        throw new Error('foo');
      });
      (await whenFunction(answers, '/foo/bar')).should.equal(true);
      fileSystem.readFile.should.have.been.called(2)
        .with.exactly('/foo/bar/.git/config', 'utf8')
        .and.exactly('/foo/bar/package.json', 'utf8');
      answers.should.not.have.property('repository');
    });

  });

});
