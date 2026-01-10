import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Award, TrendingUp, Droplets, MapPin, FileText, Edit, ShieldCheck, CheckCircle, Clock, Users } from 'lucide-react';

const Profile = () => {
  const { user, refreshUserStats } = useAuth();

  React.useEffect(() => {
    refreshUserStats();
  }, []);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  // Role-based Stats & Content
  const getRoleBasedData = () => {
    const role = user.role || 'Citizen';

    switch (role) {
      case 'Government':
        return {
          stats: [
            { label: 'Reports Verified', value: user.reportsSubmitted, color: 'text-blue-600' },
            { label: 'Policies Enforced', value: 12, color: 'text-indigo-600' },
            { label: 'Jurisdictions Managed', value: 4, color: 'text-gray-700' },
          ],
          achievements: [
            { icon: <ShieldCheck className="h-5 w-5" />, title: 'Verifications', count: user.reportsSubmitted, target: 100 },
            { icon: <FileText className="h-5 w-5" />, title: 'Official Responses', count: 34, target: 50 },
            { icon: <MapPin className="h-5 w-5" />, title: 'Zones Monitored', count: 4, target: 10 },
          ],
          badges: [
            { name: 'Official Overseer', level: 'Gold', description: 'Verified 50+ reports' },
            { name: 'Policy Maker', level: 'Silver', description: 'Enforced 10 environmental regulations' },
            { name: 'Trusted Authority', level: 'Platinum', description: 'Top rated verification accuracy' },
          ],
          activity: [
            { icon: <CheckCircle className="h-4 w-4 text-blue-600" />, text: "Verified pollution report #REF-8832", subtext: "Mumbai Harbor • 2 hours ago" },
            { icon: <FileText className="h-4 w-4 text-indigo-600" />, text: "Issued penalty notice", subtext: "Industrial Sector 4 • 1 day ago" },
            { icon: <TrendingUp className="h-4 w-4 text-gray-700" />, text: "Updated quarterly stats", subtext: "Admin Portal • 3 days ago" }
          ]
        };
      case 'NGO':
        return {
          stats: [
            { label: 'Cleanups Organized', value: 15, color: 'text-green-600' },
            { label: 'Volunteers Mobilized', value: 342, color: 'text-emerald-600' },
            { label: 'Funds Raised', value: '₹1.2L', color: 'text-yellow-600' },
          ],
          achievements: [
            { icon: <Droplets className="h-5 w-5" />, title: 'Events Hosted', count: 15, target: 20 },
            { icon: <Users className="h-5 w-5" />, title: 'Volunteers', count: 342, target: 500 },
            { icon: <Award className="h-5 w-5" />, title: 'Impact Score', count: 850, target: 1000 },
          ],
          badges: [
            { name: 'Community Leader', level: 'Gold', description: 'Organized 10+ major events' },
            { name: 'Change Maker', level: 'Platinum', description: 'Mobilized 300+ volunteers' },
            { name: 'Eco Partner', level: 'Silver', description: 'Partnered with 5 local bodies' },
          ],
          activity: [
            { icon: <Users className="h-4 w-4 text-green-600" />, text: "Organized beach cleanup", subtext: "Juhu Beach • 1 day ago" },
            { icon: <Mail className="h-4 w-4 text-emerald-600" />, text: "Sent newsletter to volunteers", subtext: "Campaign Update • 2 days ago" },
            { icon: <Award className="h-4 w-4 text-yellow-600" />, text: "Received 'Best NGO' nomination", subtext: "City Awards • 1 week ago" }
          ]
        };
      case 'Student':
        return {
          stats: [
            { label: 'Data Points Collected', value: 156, color: 'text-purple-600' },
            { label: 'Research Papers', value: 2, color: 'text-pink-600' },
            { label: 'Field Hours', value: 45, color: 'text-cyan-600' },
          ],
          achievements: [
            { icon: <FileText className="h-5 w-5" />, title: 'Data Submissions', count: 156, target: 200 },
            { icon: <Clock className="h-5 w-5" />, title: 'Field Hours', count: 45, target: 50 },
            { icon: <Award className="h-5 w-5" />, title: 'Citations', count: 12, target: 20 },
          ],
          badges: [
            { name: 'Young Researcher', level: 'Silver', description: 'Submitted 100+ data points' },
            { name: 'Data Analyst', level: 'Bronze', description: 'Completed first research paper' },
            { name: 'Field Explorer', level: 'Gold', description: '50+ hours of field work' },
          ],
          activity: [
            { icon: <TrendingUp className="h-4 w-4 text-purple-600" />, text: "Uploaded water quality dataset", subtext: "Project Alpha • 5 hours ago" },
            { icon: <FileText className="h-4 w-4 text-pink-600" />, text: "Drafted research summary", subtext: "Thesis Work • 2 days ago" },
            { icon: <MapPin className="h-4 w-4 text-cyan-600" />, text: "Tagged location for study", subtext: "Powai Lake • 4 days ago" }
          ]
        };
      default: // Citizen
        return {
          stats: [
            { label: 'Pollution Reports', value: user.reportsSubmitted, color: 'text-ocean-primary' },
            { label: 'Clean-ups Joined', value: user.cleanUpsJoined, color: 'text-success' },
          ],
          achievements: [
            { icon: <FileText className="h-5 w-5" />, title: 'Reports Filed', count: user.reportsSubmitted, target: 20 },
            { icon: <Droplets className="h-5 w-5" />, title: 'Clean-ups Joined', count: user.cleanUpsJoined, target: 10 },
          ],
          badges: [
            { name: 'Water Guardian', level: 'Bronze', description: 'First pollution report submitted' },
            { name: 'Eco Warrior', level: 'Silver', description: 'Participated in 3+ cleanup activities' },
          ],
          activity: [
            { icon: <FileText className="h-4 w-4 text-ocean-primary" />, text: "Submitted pollution report", subtext: "Mumbai Harbor - Industrial discharge • 2 days ago" },
            { icon: <Droplets className="h-4 w-4 text-success" />, text: "Joined beach cleanup", subtext: "Volunteer participation • 5 days ago" },
          ]
        };
    }
  };

  const roleData = getRoleBasedData();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and track your environmental impact
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <Card className="ocean-card lg:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-ocean-primary to-ocean-light rounded-full flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-foreground">{user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className={`wave-animation ${user.role === 'Government' ? 'bg-blue-600' :
                user.role === 'NGO' ? 'bg-green-600' :
                  user.role === 'Student' ? 'bg-purple-600' : 'bg-ocean-primary'
                }`}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium text-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'January 2025'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Guardian Level</span>
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="text-sm font-medium text-foreground">{user.location || 'India'}</span>
              </div>
            </div>

            <Button className="w-full wave-animation">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Impact & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Impact Statistics */}
          <Card className="ocean-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-ocean-primary" />
                <span>Environmental Impact</span>
              </CardTitle>
              <CardDescription>Your contribution to conservation efforts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roleData.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card className="ocean-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-warning" />
                <span>Progress Tracking</span>
              </CardTitle>
              <CardDescription>Your journey towards milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roleData.achievements.map((achievement, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="text-ocean-primary">{achievement.icon}</div>
                        <span className="font-medium text-foreground">{achievement.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {achievement.count} / {achievement.target}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.count / achievement.target) * 100}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {achievement.target - achievement.count > 0
                        ? `${achievement.target - achievement.count} more to reach target`
                        : 'Target achieved! 🎉'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badges & Achievements */}
          <Card className="ocean-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-warning" />
                <span>Badges & Recognition</span>
              </CardTitle>
              <CardDescription>Awards earned for environmental contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roleData.badges.map((badge, index) => (
                  <div key={index} className="text-center p-4 bg-card/50 rounded-lg border border-border">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-warning to-accent rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-warning-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{badge.name}</h3>
                    <Badge
                      className={
                        badge.level === 'Bronze' ? 'bg-amber-600 text-white' :
                          badge.level === 'Silver' ? 'bg-gray-400 text-white' :
                            'bg-yellow-500 text-white'
                      }
                    >
                      {badge.level}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">{badge.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="ocean-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest contributions to water conservation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roleData.activity.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-card/50 rounded-lg">
                <div className="w-8 h-8 bg-card/30 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;