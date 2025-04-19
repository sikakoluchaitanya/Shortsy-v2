import { UserSearch } from "@/components/admin/users/user-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers } from "@/Server/actions/admin/users/get-all-users";
import { auth } from "@/Server/auth";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";


export const metadata: Metadata = {
    title: "User Management | Admin | Shortsy",
    description: "Manage users in the Shortsy admin panel",
};

export default async function UserManagementPage({
    searchParams,
}: {
    searchParams: Promise<{
        page?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }>;
}) {
    const session = await auth();

    if(!session?.user) {
        redirect("/login");
    }

    if(session?.user.role !== "admin") {
        redirect("/dashboard");
    }

    const params = await searchParams;
    const page = params.page ? parseInt(params.page) : 1;
    const search = params.search || "";
    const sortBy = ( params.sortBy || "createdAt" ) as 
        | "name"
        | "email"
        | "role"
        | "createdAt";
    const sortOrder = ( params.sortOrder || "desc" ) as "asc" | "desc";

    const response = await getAllUsers({
        page,
        search,
        sortBy,
        sortOrder,
    });

    const users = response.success && response.data ? response.data.users : [];
    const total = response.success && response.data ? response.data.total : 0;

    return (
        <>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">
                <Link href="/admin" passHref>
                    <Button variant={"outline"} size={"sm"} className="gap-2">
                        <ArrowLeft className="size-4"/>
                        Back to Admin
                    </Button>
                </Link>
            </h1>
        </div>

        <div className="grid gaap-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        View and manage all users in the Shortsy
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space=-y-4">
                        <UserSearch initialSearch={search} />
                    </div>
                </CardContent>
            </Card>
        </div>
        </>

    )
}