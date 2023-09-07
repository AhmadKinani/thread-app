"use server"
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDb } from "../mongoose"
import { FilterQuery, SortOrder } from "mongoose";

interface params{
    text :string,
    author :string,
    communityId : string | null,
    path : string
}
export async function createThread({text,author,communityId,path} : params) {
    connectToDb();
    const createdThread = await Thread.create({
        text,
        author,
        community: null
    });
    await User.findByIdAndUpdate(author,{
        $push : {threads : createdThread._id }
    })

    revalidatePath(path);
}

export async function fetchPosts(pageNumber = 1 , pageSize=20) {
    connectToDb();

    const skipAmount =(pageNumber-1)* pageSize;

    const postsQuery = Thread.find({parentId : { $in : [null ,undefined]}})
        .sort({createdAt: 'desc'})
        .skip(skipAmount)
        .limit(+pageSize)
        .populate({path : 'author' ,model :User})
        .populate({
            path : 'children',
            populate : {
                path: 'author',
                model : User,
                select : "_id name parentId image"
            }
        })
    const totalPostsCount  = await Thread.countDocuments({parentId : { $in : [null ,undefined]}});
    const posts =await postsQuery.exec();

    const isNext = totalPostsCount >skipAmount + posts.length;

    return {posts,isNext};
}

export async function fetchThreadById(id:string) {
    connectToDb();
    try {
        const thread = await Thread.findById(id)
        .populate({
            path : 'author',
            model : User,
            select : "_id id name image"
        })
        .populate({
            path : "children",
            populate : [
                {
                    path : 'author',
                    model : User,
                    select :"_id id name parentId image"
                },
                {
                    path : "children",
                    model : Thread,
                    populate : {
                        path:'author',
                        model : User,
                        select : "_id id name parentId image"
                    }
                }
            ]
        }).exec();
        return thread;
    } catch (error : any) {
        throw new Error(`error fetching thread : ${error.message}`)
    }
}

export async function addCommentToThread(
    threadId : string,
    commentText : string,
    userId : string,
    path : string
) {
    connectToDb();
    try {
        const originalThread =await Thread.findById(threadId);
        if(!originalThread){
            throw new Error("thread not found")
        }
        const commentThread = new Thread({
            text:commentText,
            author: userId,
            parentId : threadId
        });

        const saveCommentThread = await commentThread.save();
        originalThread.children.push(saveCommentThread._id);
        await originalThread.save();
        revalidatePath(path);
    } catch (error:any) {
        throw new Error(`Error adding comment to thread : ${error.message}`)
    }
}

export async function fetchUsers({
    userId,
    searchString= "",
    pageNumber=1,
    pageSize=20,
    sortBy = "desc"
}:{
    userId : string,
    searchString ?: string,
    pageNumber ?:number,
    pageSize?:number,
    sortBy ?:SortOrder
}) {
    try {
        connectToDb();

        const skipAmount = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString,'i');
        const query : FilterQuery<typeof User>= {
            id: {$ne : userId}

        } 

        if(searchString.trim() !== '')
        {
            query.$or=[
                {username : {$regex :regex}},
                {name : {$regex:regex}}
            ]
        }
        const sortOptions = {createdAt : sortBy}
        const userQuery = User.find(query)
        .sort(sortOptions)
        .skip(skipAmount)
        .limit(pageSize);
        const totalUsersCount = await User.countDocuments(query);
        const users = await userQuery.exec();
        const isNext = totalUsersCount > skipAmount + users.length;
        return({users,isNext})
    } catch (error: any) {
        throw new Error(`failed to fetch Users : ${error.message}`)
    }
}