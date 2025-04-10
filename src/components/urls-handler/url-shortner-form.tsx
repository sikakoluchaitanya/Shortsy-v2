"use client"
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { UrlFormData, urlSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { shortenUrl } from "@/Server/actions/urls/shorten-url";

export function UrlShortnerForm() {
    const router = useRouter();
    const pathname = usePathname();

    const [shortUrl, setShortUrl] = useState<string | null>(null);
    const [shortCode, setShortCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const form = useForm<UrlFormData>({
        resolver: zodResolver(urlSchema),
        defaultValues: {
            url: "",
        },
    });

    const onSubmit = async (data: UrlFormData) => {
        setIsLoading(true);
        setError(null);
        setShortUrl(null);
        setShortCode(null);

        try {
            const formData = new FormData();
            formData.append("url", data.url);

            const response = await shortenUrl(formData)
            if(response.success && response.data ) {
                setShortUrl(response.data.shortUrl);

                const shortCodeMatch = response.data.shortUrl.match(/\/r\/([^/]+)$/);
                if(shortCodeMatch && shortCodeMatch[1]) {
                    setShortCode(shortCodeMatch[1])
                }
            }
        } catch (error) {
            setError("an error occurred while url shorting")
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div className="w-full max-w-2xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl className="flex-1">
                                        <Input
                                            placeholder="Enter your URL here..."
                                            {...field}
                                            disabled={false}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            { isLoading ? (
                                <>
                                    <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"/>
                                    Shortening...
                                </>
                            ) : (
                                "Shorten URL"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
        </>
    )
}