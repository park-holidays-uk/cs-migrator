# cs-migrator

This Branch of cs-migrator is for migrating from our old Parkholidays stack into our 3 new branded stacks.

Please check out the main branch to see how the migrator was originally designed to work.


## Running the migration


First create some usable code: `npm install` followed by `npm run build`

Create a valid `.env` file. The structure and contents can be taken from LastPass `niobe_contentstack-legacy-sync`.

Followed by using `npm start`.



## Content Types

Thers is also a tool available to import/export current Content Type structures.

`npm run types`


## Dynamo scripts

There is also a tool to read in json structures from file and upload into DynamoDB.

`npm run dynamo`

## Migrations

Also added code to create migrations for contentstack -> contentstack migrations. i.e. When contentypes change.

e.g. `npm run migrateSlugs`