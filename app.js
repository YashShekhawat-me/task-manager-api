import {addTask , listTasks , completeTask , deleteTask} from "./taskServices.js";
switch(process.argv[2]){
    case "add":
        addTask(process.argv[3]);        
        break;


    case "list":
        listTasks();
        break;


    case "complete":
        completeTask(Number(process.argv[3]));
        break;


    case "delete":
        deleteTask(Number(process.argv[3]));
        break;



    default:
        console.log("galat dhala bhadwe");
        break;
    }