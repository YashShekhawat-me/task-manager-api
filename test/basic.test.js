import {test , expect} from "@jest/globals";

test("adds to number" , () => {
    expect(10+15).toBe(25);
});

test("both object are same" , ()=>{
    const obj1 = {title: "learn jest" , completed: undefined};
    const obj2 = {title: "learn jest" , completed: undefined};
    expect(obj1).toStrictEqual(obj2);
});

test("contains post" , ()=>{
    const a = [ "yash", "POST" , "DELETE"];
    expect(a).toContain("yash");
});