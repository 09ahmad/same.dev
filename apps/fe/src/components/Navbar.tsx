"use client"
import AppbarAuth from "./AppbarAuth";
import { useRouter } from "next/navigation";

export default function Navbar(){
  const router = useRouter()
    return<div>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-slate-300 font-bold text-2xl cursor-pointer  " onClick={()=>router.push("/")}>
                same.dev
              </div>
            </div>
            <div className="flex gap-4">
                <AppbarAuth />
            </div>
          </div>
        </div>
    </div>
}