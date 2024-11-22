import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useContext, useState } from "react";
import { ApiUrlContext } from "./api-url";
import { generateProfile } from "@/lib/generate-profile";

const formSchema = z.object({
  voiceName: z.string(),
  pitch: z.string(),
  rate: z.string(),
  text: z.string(),
  format: z.string(),
  token: z.string(),
  volume: z.string(),
});

export function SynthesisForm() {
  const context = useContext(ApiUrlContext);
  if (!context) {
    throw new Error("SynthesisForm must be used within an ApiUrlProvider");
  }
  const { apiUrl } = context;
  const { toast } = useToast();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voiceName: "zh-CN-XiaoxiaoNeural",
      pitch: "",
      rate: "",
      text: "",
      format: "audio-24khz-48kbitrate-mono-mp3",
      token: "",
      volume: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(
    values: z.infer<typeof formSchema>,
    type: "legado" | "ireadnote" | "sourcereader",
  ) {
    console.log(values);
    const result = generateProfile(type, apiUrl, values);
    navigator.clipboard
      .writeText(typeof result === "string" ? result : JSON.stringify(result))
      .then(() => {
        toast({
          title: "已复制到剪贴板",
        });
      })
      .catch(() => {
        toast({
          title: "复制失败",
        });
      });
  }

  function tryListen(values: z.infer<typeof formSchema>) {
    const url = new URL(apiUrl);
    url.pathname = "/api/synthesis";

    // Use for...in to set URL parameters
    for (const key in values) {
      const value = values[key as keyof typeof values];
      // Set default text to "你好" if empty
      if (key === "text" && value === "") {
        url.searchParams.set(key, "你好");
      } else {
        // Only set parameter if value is not empty
        if (value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    console.log(url.toString());
    setAudioUrl(url.toString());
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form className="space-y-2">
          <FormField
            control={form.control}
            name="voiceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voice Name</FormLabel>
                <FormControl>
                  <Input placeholder="voice name" {...field} />
                </FormControl>
                <FormDescription>
                  The voice name to use for the synthesis.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text</FormLabel>
                <FormControl>
                  <Input placeholder="text" {...field} />
                </FormControl>
                <FormDescription>The text to synthesize.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token</FormLabel>
                <FormControl>
                  <Input placeholder="token" {...field} />
                </FormControl>
                <FormDescription>
                  The token to use for the synthesis.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" noBorder>
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="pitch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pitch</FormLabel>
                      <FormControl>
                        <Input placeholder="pitch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Input placeholder="rate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format</FormLabel>
                      <FormControl>
                        <Input placeholder="format" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume</FormLabel>
                      <FormControl>
                        <Input placeholder="volume" {...field} />
                      </FormControl>
                      <FormDescription>
                        The volume to use for the synthesis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <section className="flex flex-col gap-2">
            <Button onClick={form.handleSubmit((v) => onSubmit(v, "legado"))}>
              Copy Legado
            </Button>
            <Button
              onClick={form.handleSubmit((v) => onSubmit(v, "ireadnote"))}
            >
              Copy IReadNote
            </Button>
            <Button
              onClick={form.handleSubmit((v) => onSubmit(v, "sourcereader"))}
            >
              Copy SourceReader
            </Button>
            <Button onClick={form.handleSubmit((v) => tryListen(v))}>
              Try Listen
            </Button>
            <Button type="reset" onClick={() => form.reset()}>
              Reset
            </Button>
          </section>
        </form>
      </Form>
      <AudioPlayer url={audioUrl} />
    </div>
  );
}

function AudioPlayer({ url }: { url: string | null }) {
  return (
    <>
      {url && (
        <audio src={url} controls>
          <track kind="captions" />
        </audio>
      )}
    </>
  );
}
