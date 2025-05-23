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
import { AlertTriangle, Copy, QrCode } from "lucide-react";
import { useSession } from "next-auth/react";
import { QrCodeModal } from "../modals/qr-code-modal";
import { toast } from "sonner";
import { set } from "date-fns";
import { SignupSuggestionDialog } from "../dialogs/signup-suggestion-dialog";


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
    const [showSignupDialog, setShowSignupDialog] = useState(false);
    const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
    const [flaggedinfo, setFlaggedinfo] = useState<{
        flagged: boolean;
        resaon: string | undefined;
        message: string | undefined;
    } | null>(null);


    const form = useForm<UrlFormData>({
        resolver: zodResolver(urlSchema) as any, // just to bypass the typescript error but the validation is working fine
        defaultValues: {
            url: "",
            customCode: "" ,
        },
    });

    const onSubmit = async (data: UrlFormData) => {
        setIsLoading(true);
        setError(null);
        setShortUrl(null);
        setShortCode(null);
        setFlaggedinfo(null);

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

                if(response.data.flagged) {
                    setFlaggedinfo({
                        flagged: response.data.flagged,
                        resaon: response.data.flagReason || undefined,
                        message: response.data.message,
                    });
                    toast.warning(response.data.message || "Your URL is flagged for review.",{
                        description: response.data.flagReason,
                    });
                } else {
                    toast.success("URL shortened successfully!");
                }
            }

            if(session?.user && pathname.includes("/dashboard")) {
                router.refresh(); 
            }

            if(!session?.user) {
                setShowSignupDialog(true);
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
                                {flaggedinfo && flaggedinfo.flagged && (
                                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"/>
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                                    This URL has been flagged for review
                                                </p>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                                    {flaggedinfo.message ||
                                                    "this URL will be reviwed by our moderators before it becomes fully active"}
                                                </p>
                                                {flaggedinfo.resaon && (
                                                    <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
                                                        <span className="font-medium">Reason:</span>{""}
                                                        {flaggedinfo.resaon || "Unknown reason"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </form>
            </Form>
        </div>

        <SignupSuggestionDialog
            isOpen={showSignupDialog}
            onOpenChange={setShowSignupDialog}
            shortUrl={shortUrl || ""}
        />

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