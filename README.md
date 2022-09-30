# cs-migrator
Tool to migrate data into contentstack ( PLUS extra utilities around data within contentstack)

This tool assumes you have a database available containing all the latest data.


## Setup a database

To create a database in a docker container run:

```
docker run --name parkLeisureData -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root_password -e MYSQL_DATABASE=parkleisure -d mysql:5.7
```

This will create a container with a mysql database in it called `parkleisure`

You can then populate this database from a dump file by running this command:

```
cat parkleisureholidays-01-07-2022.sql | docker exec -i parkLeisureData /usr/bin/mysql -u root --password=root_password parkleisure

```

Please not this needs to be run from the directory containing your database dump named: `ph_db_with_data.sql`


## Running the migration

This migration assumes you have no entries within Contentstack and already have the required structure setup as Content-types.

First create some usable code: `npm install` followed by `npm run build`

Create a valid `.env` file. The structure and contents can be taken from LastPass.

Followed by using `npm start`.



### cache.json

This migration process keeps track of the newly created entries and its associated ContentStack uid in the dataCache json files.

The keys to this object are taken from the entries original id within the parkleisure db.

This will allow us to decipher which records in the old db point to which uid within ContentStack.


## Publishing

Scripts available for bulk publishing.

`npm run publish`

## Content Types

Thers is also a tool available to import/export current Content Type structures.

`npm run types`


## Dynamo scripts

There is also a tool to read in json structures from file and upload into DynamoDB.

`npm run dynamo`

## Migrations

Also added code to create migrations for contentstack -> contentstack migrations. i.e. When contentypes change.

e.g. `npm run migrateSlugs`