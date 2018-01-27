const path = require('path');
const fs = require('fs');
const async = require('async');
const Migration = require('../api/models/migrationModel');

const migrator = {};

migrator.create = function(basename) {
    if (!basename || basename.toString().length <= 0) return console.log("File name can not be empty");

    const filePath = createMigrationPath(basename);

    if (fs.existsSync(filePath)) return console.log("Migration file " + basename + " already exists");

    createMigrationFile(basename, function(err) {
        if (err) return console.log("Creating migration file " + basename + " error: ", err);

        return console.log("Created migration: ", basename)
    })
};

migrator.migrate = function(basename, callback) {
    console.log("Running migration: ", basename);

    const migration = require('../api/migrations/' + basename);

    if (!migration.migrate) {
        return callback(new Error( `Migration "${basename}" is missing the migrate() function`))
    }

    Migration.findOne({name: basename}, function(err, migrationRecord) {
        if (err) return callback(err);

        if (!migrationRecord) {
            Migration.create({name: basename}, function(err, _) {
                if (err) return callback(err);

                migration.migrate(function(e, _) {
                    if (e) {
                        console.log(`Migration ${basename} failed`);
                        Migration.update({name: basename}, {status: 'failed'}, callback)
                    } else {
                        console.log(`Migration ${basename} completed`);
                        Migration.update({name: basename}, {status: 'completed'}, callback)
                    }
                })
            });

            return
        }

        if (migrationRecord.status === 'completed') {
            console.log(`Migration ${basename} is already completed`);
            return callback(null)
        }

        console.log(`Migration ${basename} is in ${migrationRecord.status} state`);
        return callback(null)
    })
};

migrator.runMigration = function() {
    getAllMigrationNames(function(err, basenames) {
        if (err) return console.log(err);

        console.log("all files: ", basenames);
        async.each(basenames, function(basename, callback) {
          migrator.migrate(basename, function(e, _) {
            if (e) {
              console.log(e.message);
              return callback(e)
            }
            return callback()
          })
        }, function(e) {
            console.log("Migration done!");
            process.exit(e ? 1 : 0);
        })
    })
};

module.exports = migrator;

function getAllMigrationNames(callback) {
    const dir = `${__dirname}/../api/migrations`;

    fs.readdir(dir, function(err, files) {
        var migrationFiles = files.filter(function(file) {
            return file.split('.').pop() === 'js'
        }).map(function(file) {
            return path.basename(file, '.js')
        });
        return callback(err, migrationFiles)
    })
}

function createMigrationFile(name, callback) {
    getTemplate(function(err, template) {
        if (err) return callback(err);

        const filePath = createMigrationPath(name);

        fs.writeFile(filePath, template, function(err) {
            return callback(err)
        })
    })
}

function createMigrationPath(name) {
    return `${__dirname}/../api/migrations/${name}.js`
}

function getTemplate(callback) {
    fs.readFile(__dirname + '/../api/migrations/migration_template', callback)
}

