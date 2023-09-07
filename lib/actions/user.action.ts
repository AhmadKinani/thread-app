"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDb } from "../mongoose"
import Thread from "../models/thread.model";


interface Params {
    userId :string ,
    username :string,
    name :string,
    bio : string,
    image : string,
    path: string
}

export async function updateUser (
    {
        userId ,
        username ,
        name ,
        bio,
        image,
        path
    }: Params   ) :Promise <void> {
    connectToDb();
    try{
        await User.findOneAndUpdate(
            {id : userId},
            {
                username : username.toLowerCase(),
                name,
                bio,
                image,
                onboarded : true
            },
            {upsert : true}
        )
        if(path === '/profile/edit'){
            revalidatePath(path);
        }
    }catch(error : any){
        throw new Error(`failed to create user : ${error.message}`);
    }
}

export async function fetchUser(userId : string) {
    try {
        connectToDb();
        return await User
            .findOne({id : userId})
          //  .populate({
          //      path : 'communities',
            //    model : community
           // })
    } catch (error) {
        throw new Error(`failed to fetch user : ${error}`);
    }
}

export async function fetchUserPosts(userId : string){
    try {
        connectToDb();
        const threads =User.findOne({id : userId})
            .populate({
                path : 'threads',
                model : Thread,
                populate : {
                    path : 'children',
                    model : Thread,
                    populate : {
                        path : 'author',
                        model :User,
                        select : 'name image id'
                    }
                }
            })
            return threads;
    } catch (error) {
        throw new Error (`failed to fetch posts : ${error.message}`)
    }
}

export async function getActivity(userId:string){
    try {
        connectToDb();
        const userThreads = await Thread.find({author : userId});
        const childThreadIds =userThreads.reduce((acc,userThreads)=>{
            return acc.concat(userThreads.children);
        },[])
        const replies = await Thread.find({
            _id: {$in : childThreadIds},
            author : {$ne: userId}
        }).populate({
            path : 'author',
            model : User,
            select : 'name image _id'
        })
        return replies;
    } catch (error: any) {
        throw new Error(`failed to fetch activity : ${error.message}`)
    }
}