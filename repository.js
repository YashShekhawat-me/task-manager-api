import pool from "./db.js";

export async function getTaskById(taskId){
    return await pool.query("select * from tasks where id = $1" , [taskId]);
}

export async function addTaskRepo(taskTitle){
    return await pool.query("INSERT INTO tasks (title) VALUES ($1) RETURNING *" , [taskTitle]);
}

export async function deleteById(taskId){
    return await pool.query("DELETE FROM tasks WHERE ID = $1 RETURNING *" , [taskId]);
}

export async function listTaskRepo(completed , limit , offset , sort , order , search){
    //conditions that are in where clause
    const conditions = [];
    
    //search and limit and offset 
    const snlo = [];
    
    //values for every placeholder  
    const values = [];
    
    let queryParamNum = 1;
    
    let queryParamNum2 = 1;
    //values storage for 2nd query
    const values2 = [];
    //check if completed is there
    if(completed !== undefined){
        conditions.push("completed = $" + queryParamNum);
        queryParamNum++;
        values.push(completed);
        values2.push(completed);
        queryParamNum2++;
    }
    
    snlo.push("order by " + sort + " " + order);

    //check if search is there
    if(search !== undefined){
        conditions.push("title ILIKE $" + queryParamNum);
        values.push(`%${search}%`);
        values2.push(`%${search}%`);
        queryParamNum2++;
        queryParamNum++;
    }

    //default values of limit and offset being pushed
    snlo.push("limit $" + queryParamNum);
    values.push(limit);
    queryParamNum++;
    
    snlo.push("offset $" + queryParamNum);
    values.push(offset);
    
    //building query number 1 
    const conditionsQuery = " where " + conditions.join(" and ");
    const snloQuery = snlo.join(" ");
    let query1;
    if(conditions.length === 0){
        query1 =   "select * from tasks " + snloQuery + ";"
    } else {
        query1 = "select * from tasks" + conditionsQuery + " " + snloQuery + ";" ;
    }

    const resQuery1 =  await pool.query(query1 , values);

    let query2;
    let cndQuery = " where " + conditions.join(" and ");
    if(conditions.length === 0){
        query2 = "select count(*) from tasks;";
    } else {
        query2 = "select count(*) from tasks" + cndQuery + ";";
    }

      //return {"data": resQuery1 , "pagination" : {"limit" : limit , "offset" : offset , "total" : Number(resQuery2.rows[0].count)}};

    const resQuery2 = await pool.query(query2 ,values2);
    // console.log(query1);
    // console.log(resQuery1);
    // console.log(query2);
    // console.log(resQuery2);

    return {"data": resQuery1.rows , "pagination" : {"limit" : limit , "offset" : offset , "total" : Number(resQuery2.rows[0].count)}};

}

export async function updateTaskRepo(taskId , body) {
    const fields = [];
    const values = [];
    let queryParamNum = 1;
    if(Object.hasOwn(body , "completed"))
    {
        fields.push("completed = $" + queryParamNum);
        values.push(body.completed);
        queryParamNum = queryParamNum + 1;
    }
    if(Object.hasOwn(body , "title"))
    {
        fields.push("title = $" + queryParamNum);
        values.push(body.title);
        queryParamNum = queryParamNum + 1;
    }
    values.push(taskId);
    const SqlQuery = fields.join(", ");
    const query = "UPDATE tasks " + "SET " +  SqlQuery + " where id = $" + queryParamNum + " RETURNING *";
    return await pool.query(query , values);
}