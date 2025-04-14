import { use, useCallback, useEffect, useState } from 'react';
import Qrcode from "qrcode"
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image"
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface QrCodeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    shortCode: string;
}


export function QrCodeModal({
    isOpen,
    onOpenChange,
    url,
    shortCode,
}: QrCodeModalProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generateQrCode = useCallback(async () => {
        if (!url) return;
        setIsGenerating(true);

        try {
            const dataUrl = await Qrcode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            });
            setQrCodeDataUrl(dataUrl);
        } catch (error) {
            console.error("Error generating QR code", error);
            toast.error("Error generating QR code", {
                description: "There was an error generating the QR code. Please try again.",
            });
        } finally {
            setIsGenerating(false);
        }
    }, [url]);

    useEffect(() => {
        if(isOpen && url) {
            generateQrCode();
        }
    }, [isOpen, url, generateQrCode]);

    const downloadQrCode = () => {
        if(!qrCodeDataUrl) return;
        const link = document.createElement("a");
        link.href = qrCodeDataUrl;
        link.download = `Shortsy QR Code - ${shortCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("QR code downloaded", {
            description: "The QR code has been downloaded.",
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for your Shorten Url </DialogTitle>
                </DialogHeader>
                <div className='flex flex-col items-center justify-center p-4'>
                    {isGenerating ? (
                        <div className='flex items-center justify-center w-[300px] h-[300px]'>
                            <div className='size-8 animate-spin rounded-full border-4 border-primary border-t border-t-transparent'/>
                        </div>
                    ): qrCodeDataUrl ? (
                        <div className='flex flex-col items-center space-y-4'>
                            <Image
                                src={qrCodeDataUrl}
                                alt="QR Code"
                                width={300}
                                height={300}
                                className='border rounded-md'
                                unoptimized
                            />
                            <p>
                                Scan the QR code to open the link in your device's browser.
                            </p>
                            <Button onClick={downloadQrCode} className='w-full'>
                                <Download className='size-4 mr-2'/>
                                Download QR Code
                            </Button>
                        </div>
                    ) : (
                        <div className='text-center text-muted-foreground'>
                            Failed to generate QR code. Please try again.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}