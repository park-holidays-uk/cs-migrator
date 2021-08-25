# cs-migrator
Tool to migrate data into contentstack

This tool assumes you have a database available containing all the latest data.


## Setup a database

To create a database in a docker container run:

```
docker run --name parksData -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root_password -e MYSQL_DATABASE=ph_db -d mysql:5.7
```

This will create a container with a mysql database in it called `ph_db`

You can then populate this database from a dump file by running this command:

```
cat ph_db_with_data.sql | docker exec -i parksData /usr/bin/mysql -u root --password=root_password ph_db
```

Please not this needs to be run from the directory containing your database dump named: `ph_db_with_data.sql`


## Running the migration

This migration assumes you have no entries within Contentstack and already have the required structure setup as Content-types.

Use `npm run migrate` to import all the data.

Use `npm run remove`  to delete all the entries.

