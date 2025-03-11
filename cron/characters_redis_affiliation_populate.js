'use strict';

module.exports = {
exec: f,
      span: 1
}

var m = false;
var date = undefined;

const affLong = 'select character_id, lastAffUpdated from ew_characters where lastAffUpdated <= date_sub(now(), interval 1 day) order by lastAffUpdated limit 1000';
const affRecent = 'select * from (select character_id, lastAffUpdated from ew_characters where lastEmploymentChange  >= date_sub(now(), interval 5 year) order by lastEmploymentChange desc) as f where lastAffUpdated < date_sub(now(), interval 1 day) limit 10000';
 
const bucketLong = 'evewho:affiliates';
const bucketRecent = 'evewho:affiliates:recent';

async function f(app) {
    if (m == false) {
        try {
            m = true;

            if (await getCount(app, bucketLong) == 0) populate(app, affLong, bucketLong);
            if (await getCount(app, bucketRecent) == 0) populate(app, affRecent, bucketRecent);
        } finally {
            m = false;
        }
    }
}

async function getCount(app, bucket) {
    return parseInt(await app.redis.scard(bucket));
}

async function populate(app, query, bucket) {
    let chars = await app.mysql.query(query);
    for (let i = 0; i < chars.length; i++) {
        var row = chars[i];

        await app.redis.sadd('evewho:affiliates:full', row.character_id);
        await app.redis.sadd(bucket, row.character_id);
        await app.mysql.query('update ew_characters set lastAffUpdated = now() where character_id = ?', row.character_id);
    }
}
