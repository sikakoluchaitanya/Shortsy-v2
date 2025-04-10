import { UrlShortnerForm} from "@/components/urls-handler/url-shortner-form";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-24">
      <div className="w-full max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Shortsy</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Shortsy is a URL shortener that allows you to create short links for your long URLs. It's simple, fast, and easy to use.
        </p>

        <UrlShortnerForm />
      </div>
    </div>
  );
}
