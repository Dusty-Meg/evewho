module.exports = f;

async function f(app) {
    let result = await app.mysql.query('select * from ew_corporations where recalc = 1');
    for (let i = 0; i < result.length; i++) {
        let row = result[i];

        let active, info;
        if (row.corporation_id < 1999999) {
            active = 9;
        } else {
            active = await app.mysql.queryField('count', 'select count(1) count from ew_history where start_date >= date_sub(now(), interval 3 month) and corporation_id = ?', [row.corporation_id]);
        }
            info = await app.mysql.queryRow('select count(1) count, avg(sec_status) avg_sec_status from ew_characters where corporation_id =?', [row.corporation_id]);
        let activity_level = Math.max(0, Math.min(9, Math.floor(Math.log(active))));
   
        await app.mysql.query('update ew_corporations set memberCount = ?, avg_sec_status = ?, active = ?, diff = -1 * (mc_7 - ?), recalc = 0 where corporation_id = ?', [info.count, info.avg_sec_status, activity_level, info.count, row.corporation_id]);
    }
}