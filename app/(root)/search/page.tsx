

import ProfileHeader from "@/components/shared/ProfileHeader";
import { fetchUser, fetchUserPosts } from "@/lib/actions/user.action";
import User from "@/lib/models/user.model";
import { currentUser } from "@clerk/nextjs";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { profileTabs } from "@/constants";
import Image from "next/image";
import ThreadsTab from "@/components/shared/ThreadsTab";
import { fetchUsers } from "@/lib/actions/thread.actions";
import UserCard from "@/components/cards/UserCard";

const Page =async () => {
    const user=await currentUser();
    if(!user)return null;

    const userInfo = await fetchUser(user.id);

    if(!userInfo?.onboarded) redirect('/onboarding');

    const result = await  fetchUsers({
        userId : user.id,
        searchString : '',
        pageNumber: 1,
        pageSize : 25
    })

  return (
    <section>
      <h1 className="head-text mb-10">search</h1>

      <div className="mt-14 flex flex-col gap-9">
        {result.users.length === 0 ?(
          <p className="no-result">No Users</p>
        ):(
          <>
            {result.users.map((person)=>(
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            ))}
          </>
        )}  
      </div>
    </section>
  )
}

export default Page
