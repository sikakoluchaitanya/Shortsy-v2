import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlShortnerForm } from '@/components/urls-handler/url-shortner-form';
import { UserUrlsTable } from '@/components/urls-handler/user-urls-table';
import { getUserUrls } from '@/Server/actions/urls/get-user-urls';
import { auth } from '@/Server/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | Shortsy',
    description: 'Dashboard page for Shortsy',
}

export default async function DashboardPage() {
    const session = await auth();

    // Get users urls
    const response = await getUserUrls(session?.user.id as string);
    const userUrls = response.success && response.data ? response.data : [];

    return (
        <>
            <h1 className='text-3xl font-bold mb-8 text-center'>Dashboard</h1>

            <div className='grid gap-8'>
                <Card className='shadow-sm'>
                    <CardHeader>
                        <CardTitle>Create New Short URL</CardTitle>
                        <CardDescription>
                            Enter a long URL to create a shortened link. You can also 
                            customize the short link if you want.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UrlShortnerForm/>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Short URLs</CardTitle>
                        <CardDescription>
                            Manage and Track Your Shortened URLs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserUrlsTable urls={userUrls}/>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}