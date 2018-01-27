const mongoose = require('mongoose');

module.exports = {
  migrate: function( callback ) {

    var TestMigration = mongoose.model('TestMigration', {name: String});
    var test = new TestMigration({name: "This is a test"});
    test.save(callback)
  }
};
