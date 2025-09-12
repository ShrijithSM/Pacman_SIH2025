import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChatbotWidget from '@/components/ChatbotWidget';
import { 
  MessageCircle, 
  Code, 
  Smartphone, 
  Globe, 
  Zap,
  CheckCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      title: "Smart Conversations",
      description: "AI-powered responses for all campus-related queries"
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Multi-language Support",
      description: "Available in English, Hindi, and local languages"
    },
    {
      icon: <Smartphone className="h-6 w-6 text-primary" />,
      title: "Mobile Responsive",
      description: "Perfect experience across all devices"
    },
    {
      icon: <Code className="h-6 w-6 text-primary" />,
      title: "Easy Integration",
      description: "Simple script tag or React component import"
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Lightning Fast",
      description: "Instant responses with minimal loading"
    }
  ];

  const benefits = [
    "24/7 student support availability",
    "Reduce helpdesk workload by 70%", 
    "Instant answers to common questions",
    "Seamless integration with any website",
    "Customizable to match your brand"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-gradient-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Campus Assistant</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <a href="/docs">Documentation</a>
              </Button>
              <Button className="bg-primary hover:bg-primary-hover transition-colors">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary-light text-primary border-0">
                  Multilingual AI Assistant
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Campus Assistant
                  <span className="block text-primary">Chatbot</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Ask your questions in English, Hindi, or Local Language.
                  Get instant, intelligent responses for all your campus needs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary-hover shadow-hover hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <a href="/docs">
                    <Code className="mr-2 h-5 w-5" />
                    View Integration Guide
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary-light">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Live Demo Below
                </Button>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full"></div>
              <Card className="relative shadow-chatbot border-0">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Try the Assistant</CardTitle>
                  <CardDescription>
                    Experience the chatbot in action
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ChatbotWidget />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose Campus Assistant?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for educational institutions with modern technology and seamless integration capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Ready to Transform Your Campus Support?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of educational institutions already using Campus Assistant 
              to provide 24/7 student support.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-hover shadow-hover hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              asChild
            >
              <a href="/docs">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-gradient-card py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Campus Assistant</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Campus Assistant. Empowering education through AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
