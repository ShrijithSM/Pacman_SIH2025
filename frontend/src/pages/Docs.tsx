import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, ExternalLink, Zap, Palette, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Docs = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const scriptEmbedCode = `<script
  src="https://campus-assistant.vercel.app/embed.js"
  data-theme-color="#3B82F6"
  data-position="bottom-right"
  data-language="en"
></script>`;

  const reactImportCode = `import { CampusChatbot } from 'campus-assistant-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      <CampusChatbot
        position="bottom-right"
        primaryColor="#3B82F6"
        language="en"
      />
    </div>
  );
}`;

  const configOptions = [
    {
      prop: 'data-theme-color / primaryColor',
      type: 'string',
      default: '#3B82F6',
      description: 'Primary color for the chatbot interface'
    },
    {
      prop: 'data-position / position',
      type: 'string',
      default: 'bottom-right',
      description: 'Position of the chatbot widget: "bottom-right" or "bottom-left"'
    },
    {
      prop: 'data-language / language',
      type: 'string',
      default: 'en',
      description: 'Default language: "en" (English), "hi" (Hindi), or "local"'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
              <p className="text-muted-foreground mt-2">
                Learn how to integrate Campus Assistant into your website
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/">
                ← Back to Demo
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Quick Start */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* HTML Embed */}
            <Card className="shadow-card hover:shadow-hover transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  HTML Embed
                </CardTitle>
                <CardDescription>
                  Add to any website with a simple script tag
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="secondary" className="mb-2">Easiest Method</Badge>
                <div className="bg-muted p-4 rounded-lg relative">
                  <pre className="text-sm overflow-x-auto">
                    <code>{scriptEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(scriptEmbedCode, 'HTML embed code')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Just paste this script tag before the closing &lt;/body&gt; tag of your HTML.
                </p>
              </CardContent>
            </Card>

            {/* React Component */}
            <Card className="shadow-card hover:shadow-hover transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  React Component
                </CardTitle>
                <CardDescription>
                  Import as a React component for better integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="secondary" className="mb-2">For React Apps</Badge>
                <div className="bg-muted p-4 rounded-lg relative">
                  <pre className="text-sm overflow-x-auto">
                    <code>{reactImportCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(reactImportCode, 'React component code')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Install via npm: <code className="bg-secondary px-1 rounded">npm install campus-assistant-widget</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Configuration Options */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Configuration Options</h2>
          </div>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Customization Properties</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold">Property</th>
                      <th className="text-left py-3 px-2 font-semibold">Type</th>
                      <th className="text-left py-3 px-2 font-semibold">Default</th>
                      <th className="text-left py-3 px-2 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configOptions.map((option, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-3 px-2">
                          <code className="bg-secondary px-2 py-1 rounded text-sm">
                            {option.prop}
                          </code>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{option.type}</td>
                        <td className="py-3 px-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {option.default}
                          </code>
                        </td>
                        <td className="py-3 px-2 text-sm">{option.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Language Support */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Multi-language Support</h2>
          </div>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary-light rounded-lg">
                  <h3 className="font-semibold mb-2">English</h3>
                  <code className="text-sm bg-background px-2 py-1 rounded">language="en"</code>
                </div>
                <div className="text-center p-4 bg-primary-light rounded-lg">
                  <h3 className="font-semibold mb-2">हिंदी (Hindi)</h3>
                  <code className="text-sm bg-background px-2 py-1 rounded">language="hi"</code>
                </div>
                <div className="text-center p-4 bg-primary-light rounded-lg">
                  <h3 className="font-semibold mb-2">Local Language</h3>
                  <code className="text-sm bg-background px-2 py-1 rounded">language="local"</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Advanced Examples */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Advanced Examples</h2>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Custom Styling Example</CardTitle>
              <CardDescription>
                Advanced configuration with custom colors and positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg relative">
                <pre className="text-sm overflow-x-auto">
                  <code>{`<script
  src="https://campus-assistant.vercel.app/embed.js"
  data-theme-color="#10B981"
  data-position="bottom-left"
  data-language="hi"
></script>`}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`<script
  src="https://campus-assistant.vercel.app/embed.js"
  data-theme-color="#10B981"
  data-position="bottom-left"
  data-language="hi"
></script>`, 'Advanced example')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Docs;