"use client"
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { UrlFormData, urlSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { shortenUrl } from "@/Server/actions/urls/shorten-url";
import { Card, CardContent } from "../ui/card";
import { Copy, QrCode } from "lucide-react";
import { useSession } from "next-auth/react";
import { QrCodeModal } from "../modals/qr-code-modal";


export function UrlShortnerForm() {
    const { data: session } = useSession();

    const router = useRouter();
    const pathname = usePathname();
    const [originUrl, setOriginUrl] = useState("");

    useEffect(() => {
        setOriginUrl(window.location.href)
    }, [])

    const [shortUrl, setShortUrl] = useState<string | null>(null);
    const [shortCode, setShortCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);


    const form = useForm<UrlFormData>({
        resolver: zodResolver(urlSchema),
        defaultValues: {
            url: "",
            customCode: "",
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

            if (data.customCode && data.customCode.trim() !== "") {
                formData.append("customCode", data.customCode);
            }

            const response = await shortenUrl(formData)
            if(response.success && response.data ) {
                setShortUrl(response.data.shortUrl);

                const shortCodeMatch = response.data.shortUrl.match(/\/r\/([^/]+)$/);
                if(shortCodeMatch && shortCodeMatch[1]) {
                    setShortCode(shortCodeMatch[1])
                }
            }

            if(session?.user && pathname.includes("/dashboard")) {
                router.refresh(); 
            }
        } catch (error) {
            setError("an error occurred while url shorting")
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!shortUrl) return;

        try{
            await navigator.clipboard.writeText(shortUrl);
        } catch (error) {
            console.error("Failed to copy: ", error);
        }
    }

    const showQrCode = () => {
        if(!shortUrl || !shortCode) return;
        setIsQrCodeModalOpen(true);
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

                    <FormField
                            control={form.control}
                            name="customCode"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl className="flex-1">
                                        <div className="flex items-center">
                                            <span className="text-sm text-muted-foreground mr-2">
                                                {process.env.NEXT_PUBLIC_APP_URL || 
                                                    originUrl}
                                                /r/
                                            </span>
                                            <Input
                                                placeholder="Enter your custom code here...(optional)"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || "")}
                                                disabled={false}
                                                className="flex-1"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {shortUrl && (
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Your shortened URL is: 
                                </p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={shortUrl}
                                        readOnly
                                        className="font-medium"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-shrink-0"
                                        onClick={copyToClipboard}
                                    >
                                        <Copy className="size-4 mr-1"/>
                                        Copy
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant={"outline"} 
                                        className="flex-shrink-0"
                                        onClick={showQrCode}
                                    >
                                        <QrCode className="size-4 mr-1"/>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
            </Form>
        </div>

        {shortUrl && shortCode && (
            <QrCodeModal
                isOpen={isQrCodeModalOpen}
                onOpenChange={setIsQrCodeModalOpen}
                url={shortUrl}
                shortCode={shortCode}
            />
        )}
        </>
    )
}