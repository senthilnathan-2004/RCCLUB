"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClubSettings } from "@/contexts/club-settings-context"
import { Calendar, MapPin, Users, Award, Star } from "lucide-react"
import { DynamicContent } from "@/components/dynamic-content"





const achievements = [
  { year: "2024", title: "Best Community Service Project - District Award" },
  { year: "2023", title: "Most Outstanding Rotaract Club - RID 3233" },
  { year: "2022", title: "Excellence in Professional Development" },
  { year: "2021", title: "Best New Member Engagement" },
  { year: "2020", title: "COVID Relief Initiative Recognition" },
]

export default function AboutClubPage() {
  const { settings } = useClubSettings()
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              <DynamicContent as="span" field="establishedYear" defaultText="Established 2015" />
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Rotaract Club of <span className="text-primary">AIHT</span>
            </h1>
            <DynamicContent 
              as="p" 
              field="aboutClubDescription" 
              className="mt-6 text-lg text-muted-foreground" 
              defaultText="A decade of service, leadership, and community impact. We are a community of young professionals and students united by our commitment to making a positive difference." 
            />
          </div>
        </div>
      </section>

      {/* Club Info */}
      <section className="py-16">
        <div className="container px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <MapPin className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-sm text-muted-foreground">
                  Anand Institute of Higher Technology
                  <br />
                  Chennai, Tamil Nadu
                  <br />
                  India
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Parent Club</h3>
                <p className="text-sm text-muted-foreground">
                  Rotary Club of Chennai Silk City
                  <br />
                  Rotary International
                  <br />
                  RI District 3233
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <Calendar className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Meetings</h3>
                <p className="text-sm text-muted-foreground">
                  Every Saturday
                  <br />
                  5:00 PM - 7:00 PM
                  <br />
                  Online
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <DynamicContent 
              as="div" 
              field="clubHistory" 
              className="prose prose-invert max-w-none text-muted-foreground" 
              defaultText="Rotaract Club of Apollo Institute of Hospital was chartered in 2014 with a vision to create a platform for young healthcare professionals and students to engage in meaningful community service while developing leadership skills.

Over the past decade, we have grown from a small group of 15 founding members to a vibrant community of over 50 active members. Our projects span healthcare awareness campaigns, blood donation drives, educational initiatives, and environmental conservation efforts.

What sets us apart is our unique position at the intersection of healthcare and community service. Our members bring specialized knowledge and passion to every project, making a measurable impact on the health and wellbeing of our community." 
            />
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Achievements</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {(settings?.achievements && settings.achievements.length > 0) ? (
              settings.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {achievement.year}
                  </Badge>
                </div>
              ))
             ) : (
              achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {achievement.year}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Legacy Stats */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Legacy</h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 max-w-3xl mx-auto">
            {[
              { value: <DynamicContent field="statsYearsOfService" defaultText="10+" />, label: "Years of Service" },
              { value: <DynamicContent field="legacyProjectsCompleted" defaultText="200+" />, label: "Projects Completed" },
              { value: <DynamicContent field="legacyAlumniMembers" defaultText="500+" />, label: "Alumni Members" },
              { value: <DynamicContent field="legacyLivesImpacted" defaultText="50K+" />, label: "Lives Impacted" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-accent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Be Part of Our Legacy</h2>
            <p className="text-muted-foreground mb-6">
              Join our community of young leaders and help us write the next chapter of service and impact.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/board">Meet Our Team</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
