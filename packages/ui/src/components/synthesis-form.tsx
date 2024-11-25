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
import { useContext, useEffect, useState } from "react";
import { ApiUrlContext } from "./api-url";
import { generateProfile } from "@/lib/generate-profile";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
    e?: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (e) {
      e.preventDefault();
    }
    if (!apiUrl) {
      toast({
        title: "API URL 未设置",
      });
      return;
    }
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
    if (!apiUrl) {
      toast({
        title: "API URL 未设置",
      });
      return;
    }
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
                  <VoiceNameSelect
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>声音名称。</FormDescription>
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
                  <Textarea placeholder="text" {...field} />
                </FormControl>
                <FormDescription>试听时使用。</FormDescription>
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
                  Cloudflare Workers 中设置的 TOKEN。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" noBorder>
              <AccordionTrigger>高级配置</AccordionTrigger>
              <AccordionContent className="px-2">
                <p className="text-sm mb-2">
                  高级配置，请参考{" "}
                  <a
                    href="https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody"
                    className="text-blue-500 hover:underline"
                  >
                    Microsoft 官方文档
                  </a>
                </p>
                {(["pitch", "rate", "volume", "format"] as const).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={key} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <section className="flex gap-2 flex-wrap">
            <Button onClick={(e) => onSubmit(form.getValues(), "legado", e)}>
              复制阅读配置
            </Button>
            <Button onClick={(e) => onSubmit(form.getValues(), "ireadnote", e)}>
              复制爱阅记配置
            </Button>
            <Button
              onClick={(e) => onSubmit(form.getValues(), "sourcereader", e)}
            >
              复制源阅读配置
            </Button>
            <Button onClick={form.handleSubmit(tryListen)}>试听</Button>
            <Button type="reset" onClick={() => form.reset()}>
              重置
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

async function fetchVoices() {
  const res = await fetch(
    "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4",
  );
  return (
    (await res.json())
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .map((v: any) => v.ShortName)
      .filter((v: string) => v.startsWith("zh-"))
  );
}

function VoiceNameSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [voices, setVoices] = useState<string[]>([]);
  useEffect(() => {
    fetchVoices().then(setVoices);
  }, []);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="选择声音" />
      </SelectTrigger>
      <SelectContent>
        {voices.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
