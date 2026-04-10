"use client"

import Link from "next/link"
import { useClubSettings } from "@/contexts/club-settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Heart, Globe, ArrowRight, Award, Target, Sparkles } from "lucide-react"
import { DynamicContent } from "@/components/dynamic-content"



export default function HomePage() {
  const { settings } = useClubSettings()
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center px-2 sm:px-0">
            <Badge variant="outline" className="mb-4 border-accent text-accent">
              Rotaract Year 2025–2026
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
              <span className="block"><DynamicContent field="homeHeroTitle" defaultText="Rotaract Club of" /></span>
              <span className="block text-primary mt-1 sm:mt-2"><DynamicContent field="homeHeroSubtitle" defaultText="Anand Institute of Higher Technology" /></span>
            </h1>
            <DynamicContent 
              as="p" 
              field="homeHeroDescription" 
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty" 
              defaultText="Building future leaders through community service, professional development, and creating lasting change in our communities. RID 3233." 
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/about-club">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Member Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="container px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Active Members", value: <DynamicContent field="statsActiveMembers" defaultText="50+" />, icon: Users },
              { label: "Events This Year", value: <DynamicContent field="statsEventsThisYear" defaultText="25+" />, icon: Calendar },
              { label: "Service Hours", value: <DynamicContent field="statsServiceHours" defaultText="1000+" />, icon: Heart },
              { label: "Years of Service", value: <DynamicContent field="statsYearsOfService" defaultText="10+" />, icon: Award },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-3xl font-bold text-accent">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Purpose</h2>
            <p className="mt-2 text-muted-foreground">அறம் வழி அறம் வளர்த்து</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="bg-card border-border">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicContent 
                  as="p" 
                  field="missionStatement"
                  className="text-muted-foreground min-h-[4rem]" 
                  defaultText="To develop young professionals and students as leaders in their communities by encouraging high ethical standards, providing opportunities for professional development, and promoting service to others." 
                />
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicContent 
                  as="p" 
                  field="visionStatement"
                  className="text-muted-foreground min-h-[4rem]" 
                  defaultText="To be a catalyst for positive change in our community by empowering young professionals to take action, build meaningful connections, and create sustainable impact through service and leadership." 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Areas of Focus</h2>
            <p className="mt-2 text-muted-foreground">Making a difference in what matters most</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(settings?.areasOfFocus && settings.areasOfFocus.length > 0) ? (
              settings.areasOfFocus.map((area, index) => {
                const Icon = [Heart, Award, Globe, Users][index % 4] || Heart;
                return (
                  <Card key={index} className="bg-secondary/50 border-border hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <Icon className="h-8 w-8 text-primary mb-2" />
                      <CardTitle className="text-lg">{area.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              [
                {
                  title: "Community Service",
                  description: "Local projects addressing community needs and creating lasting impact.",
                  icon: Heart,
                },
                {
                  title: "Professional Development",
                  description: "Workshops, seminars, and networking opportunities for career growth.",
                  icon: Award,
                },
                {
                  title: "International Service",
                  description: "Collaborating with Rotaract clubs worldwide for global initiatives.",
                  icon: Globe,
                },
                {
                  title: "Club Service",
                  description: "Building fellowship and strengthening our club community.",
                  icon: Users,
                },

              ].map((area, index) => (
                <Card key={index} className="bg-secondary/50 border-border hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <area.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Join Our Community</h2>
            <DynamicContent 
              as="p" 
              field="joinCommunityText"
              className="mt-4 text-muted-foreground" 
              defaultText="Be part of a global network of young leaders making a difference. Join Rotaract Club of AIH and start your journey of service and leadership." 
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/gallery">View Our Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
