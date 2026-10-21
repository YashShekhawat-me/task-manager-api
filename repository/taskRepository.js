import pool from "../db.js";

export async function getTaskById(taskId , userId){
    return await pool.query("select * from tasks where id = $1 and user_id = $2" , [taskId , userId]);
}

export async function addTaskRepo(taskTitle , userId){
    return await pool.query("INSERT INTO tasks (title , user_id) VALUES ($1 , $2) RETURNING *" , [taskTitle , userId]);
}

export async function deleteById(taskId , userId){
    return await pool.query("DELETE FROM tasks WHERE ID = $1 and user_id = $2 RETURNING *" , [taskId , userId]);
}

export async function listTaskRepo(completed , limit , offset , sort , order , search , userId){
    const SORT_COLUMN = { id: "id" , title : "title"};
    const ORDER_DIRECTIONS = {asc: "ASC" , desc: "DESC"};
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
    
    if(!Object.hasOwn(SORT_COLUMN , sort) || !Object.hasOwn(ORDER_DIRECTIONS , order)){
        throw new Error("invalid sort or order passed to repository");
    }
    let sort1 = sort == "id" ? "title" : "id";
    snlo.push("order by " + SORT_COLUMN[sort] + " " +  ORDER_DIRECTIONS[order] + " , " + sort1 + " " + ORDER_DIRECTIONS[order]);

    //check if search is there
    if(search !== undefined){
        conditions.push("title ILIKE $" + queryParamNum);
        values.push(`%${search}%`);
        values2.push(`%${search}%`);
        queryParamNum2++;
        queryParamNum++;
    }

    conditions.push("user_id = $" + queryParamNum);
    values.push(userId);
    values2.push(userId);
    queryParamNum++;
    queryParamNum2++;
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
    
    query1 = "select * from tasks" + conditionsQuery + " " + snloQuery + ";" ;

    const resQuery1 =  await pool.query(query1 , values);

    let query2;
    
    let cndQuery = " where " + conditions.join(" and ");
    
    query2 = "select count(*) from tasks" + cndQuery + ";";

    const resQuery2 = await pool.query(query2 ,values2);
    return {"user_id" : userId ,"data": resQuery1.rows , "pagination" : {"limit" : limit , "offset" : offset , "total" : Number(resQuery2.rows[0].count)}};

}

export async function updateTaskRepo(taskId , body , userId) {
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
    values.push(userId);
    const SqlQuery = fields.join(", ");
    const query = "UPDATE tasks " + "SET " +  SqlQuery + " where id = $" + queryParamNum +" and user_id = $" + (queryParamNum + 1) +  " RETURNING *";
    return await pool.query(query , values);
}