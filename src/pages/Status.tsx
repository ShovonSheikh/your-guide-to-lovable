import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import SEO from "@/components/SEO";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function Status() {
    usePageTitle("System Status");

    // In a real implementation, this would fetch from a status API
    const services = [
        { name: "Website", status: "operational", description: "Main website and creator pages" },
        { name: "Payments (bKash)", status: "operational", description: "bKash payment processing" },
        { name: "Payments (Nagad)", status: "operational", description: "Nagad payment processing" },
        { name: "Payments (Rocket)", status: "operational", description: "Rocket payment processing" },
        { name: "Withdrawals", status: "operational", description: "Creator withdrawal requests" },
        { name: "Notifications", status: "operational", description: "Email and push notifications" },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "operational":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "degraded":
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case "outage":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "operational":
                return "Operational";
            case "degraded":
                return "Degraded Performance";
            case "outage":
                return "Service Outage";
            default:
                return "Unknown";
        }
    };

    return (
        <>
            <SEO
                title="System Status - TipKoro"
                description="Check the current operational status of TipKoro services including payments, withdrawals, and notifications."
                url="https://tipkoro.com/status"
            />
            <div className="min-h-screen bg-background">
                <TopNavbar />
                <div className="h-24" />

                <main className="container max-w-3xl py-12 px-4">
                    <h1 className="text-4xl font-display font-bold mb-4">System Status</h1>
                    <p className="text-muted-foreground mb-8">
                        Current operational status of TipKoro services
                    </p>

                    {/* Overall Status */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                                <h2 className="text-xl font-semibold text-green-600">All Systems Operational</h2>
                                <p className="text-sm text-muted-foreground">
                                    Last updated: {new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Service List */}
                    <div className="space-y-3">
                        {services.map((service) => (
                            <div
                                key={service.name}
                                className="flex items-center justify-between bg-card border border-border rounded-xl p-4"
                            >
                                <div>
                                    <h3 className="font-semibold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground">{service.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(service.status)}
                                    <span className="text-sm font-medium text-green-600">
                                        {getStatusText(service.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Incident History */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-4">Recent Incidents</h2>
                        <div className="bg-card border border-border rounded-xl p-6 text-center">
                            <p className="text-muted-foreground">No incidents reported in the last 30 days.</p>
                        </div>
                    </div>

                    {/* Report Issue */}
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground mb-2">
                            Experiencing issues not shown here?
                        </p>
                        <a href="/contact" className="text-tipkoro-gold hover:underline font-semibold">
                            Report a problem →
                        </a>
                    </div>
                </main>

                <MainFooter />
            </div>
        </>
    );
}
