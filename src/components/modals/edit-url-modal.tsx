import { updateUrl } from "@/Server/actions/urls/update-url";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

const editUrlSchema = z.object({
    customCode: z.
        string()
        .min(6, "Custom code must be at least 6 characters")
        .max(50, "Custom code must be at most 50 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Custom code must contain only alphanumeric characters, dashes, and underscores")
});

type EditUrlFormData = z.infer<typeof editUrlSchema>;

interface EditUrlModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    urlId: number;
    currentShortCode: string;
    onSuccess: (newShortCode: string) => void;
}

export function EditUrlModal({
    isOpen,
    onOpenChange,
    urlId,
    currentShortCode,
    onSuccess,
}: EditUrlModalProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const form = useForm<EditUrlFormData>({
        resolver: zodResolver(editUrlSchema),
        defaultValues: {
            customCode: currentShortCode,
        },
    });

    useEffect(() => {
        form.reset({ customCode: currentShortCode})
    }, [currentShortCode])

    const onSubmit = async (data: EditUrlFormData) => {
        setIsLoading(true);
        
        try {
            const formData = new FormData();
            formData.append("id", urlId.toString());
            formData.append("customCode", data.customCode);

            const response  = await updateUrl(formData);

            if(response.success && response.data){
                toast.success("URL updated successfully", {
                    description: "Your URL has been updated",
                });
                onSuccess(data.customCode);
                onOpenChange(false);
            } else {
                toast.error("Failed to update URL", {
                    description: response.error || "Something went wrong",
                });
            }
        } catch (error) {
            console.error("Error updating URL:", error);
            toast.error("Failed to update URL", {
                description: "Something went wrong",
            });
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <div>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Short URL</DialogTitle>
                        <DialogDescription>
                            Customize the short code for this URL. the short code must be unique
                            and can only contain alphanumeric characters, dashes, and underscores.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="customCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="flex items-center">
                                                <span className="text-sm text-muted-foreground mr-2">
                                                    {baseUrl}/r/
                                                </span>
                                                <Input
                                                    placeholder="Custom code"
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="sm:justify-end">
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    onClick={() => onOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin size-4 mr-2"/>
                                            updatting...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}