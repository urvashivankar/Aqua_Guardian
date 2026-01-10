import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, TrendingUp, Award, Droplets, Fish, MapPin, Calendar } from 'lucide-react';
import successChilika from '@/assets/chilika_lake.png';
import successMumbai from '@/assets/marina_beach.png';
import successKerala from '@/assets/kerala_backwaters.png';
import { fetchSuccessStories, createSuccessStory } from '@/services/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const SuccessStories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    timeframe: '',
    beforeImage: null as File | null,
    afterImage: null as File | null
  });

  const loadStories = async () => {
    try {
      const data = await fetchSuccessStories();
      if (data) {
        setStories(data);
      }
    } catch (error) {
      console.error("Failed to fetch success stories", error);
      setStories([]);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.beforeImage || !formData.afterImage) {
      toast.error("Please upload both before and after images");
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('location', formData.location);
    submitData.append('timeframe', formData.timeframe);
    submitData.append('before_image', formData.beforeImage);
    submitData.append('after_image', formData.afterImage);

    try {
      setIsLoading(true);
      await createSuccessStory(submitData);
      toast.success("Success story added!");
      setIsDialogOpen(false);
      setFormData({ title: '', description: '', location: '', timeframe: '', beforeImage: null, afterImage: null });
      loadStories();
    } catch (error) {
      toast.error("Failed to add story");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Model Success': return 'bg-success text-success-foreground';
      case 'Ongoing Success': return 'bg-ocean-primary text-primary-foreground';
      case 'Significant Progress': return 'bg-accent text-accent-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const overallStats = {
    totalProjects: stories.length,
    waterBodiesRestored: stories.filter(s => s.status === 'Model Success' || s.status === 'Community Resolved').length,
    speciesRecovered: stories.reduce((acc, s) => acc + (s.impact?.speciesRecovered || 0), 0),
    communitiesImpacted: stories.reduce((acc, s) => acc + (s.impact?.livesImpacted || 0), 0) > 0
      ? (stories.reduce((acc, s) => acc + (s.impact?.livesImpacted || 0), 0) > 1000 ? '45+' : '20+')
      : '0',
    pollutionReduced: stories.length > 0
      ? Math.round(stories.reduce((acc, s) => acc + (s.impact?.pollutionReduced || 0), 0) / stories.length)
      : 0,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Success Stories</h1>
          <p className="text-muted-foreground">
            Witness the transformative power of community action.
          </p>
        </div>

        {(user?.role === 'NGO' || user?.role === 'Government') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ocean-primary hover:bg-ocean-dark text-white gap-2">
                <Plus className="h-4 w-4" /> Add Success Story
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] ocean-card border-white/10 shadow-2xl backdrop-blur-xl p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Share a Success Story
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground/80">
                    Showcase the impact of your restoration efforts with photos and metrics.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 max-h-[65vh] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <form onSubmit={handleCreateStory} id="success-story-form" className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/90">Project Title</Label>
                    <Input
                      placeholder="e.g. Mumbai Harbor Reef Restoration"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10 focus:border-ocean-primary/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/90">Location</Label>
                      <Input
                        placeholder="e.g. Maharastra"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/90">Timeframe</Label>
                      <Input
                        placeholder="e.g. 2023 - 2024"
                        value={formData.timeframe}
                        onChange={e => setFormData({ ...formData, timeframe: e.target.value })}
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/90">Impact Description</Label>
                    <Textarea
                      placeholder="Describe the transformation and challenges overcome..."
                      className="min-h-[120px] bg-white/5 border-white/10 resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-ocean-light">Before Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={e => setFormData({ ...formData, beforeImage: e.target.files?.[0] || null })}
                        className="bg-transparent border-dashed border-white/20 hover:border-white/40 cursor-pointer text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-success">After Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={e => setFormData({ ...formData, afterImage: e.target.files?.[0] || null })}
                        className="bg-transparent border-dashed border-white/20 hover:border-white/40 cursor-pointer text-sm"
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/5">
                <DialogFooter>
                  <Button
                    type="submit"
                    form="success-story-form"
                    disabled={isLoading}
                    className="w-full bg-ocean-primary hover:bg-ocean-dark text-white font-bold py-6 shadow-lg shadow-ocean-primary/20 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? "Publishing..." : "Publish Story to Gallery"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Overall Impact Stats */}
      {stories.length > 0 && (
        <Card className="ocean-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-warning" />
              <span>Collective Impact Achievement</span>
            </CardTitle>
            <CardDescription>
              Combined results from all successful water restoration projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-ocean-primary mb-2">
                  {overallStats.totalProjects}
                </div>
                <div className="text-sm text-muted-foreground">Restoration Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">
                  {overallStats.waterBodiesRestored}
                </div>
                <div className="text-sm text-muted-foreground">Water Bodies Restored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">
                  {overallStats.speciesRecovered}
                </div>
                <div className="text-sm text-muted-foreground">Species Recovered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-ocean-light mb-2">
                  {overallStats.communitiesImpacted}
                </div>
                <div className="text-sm text-muted-foreground">Communities Impacted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-2">
                  {overallStats.pollutionReduced}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Pollution Reduced</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Stories */}
      <div className="space-y-12">
        {stories.map((story) => (
          <Card key={story.id} className="ocean-card overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Image Section - Before/After Comparison */}
              <div className="relative h-80 lg:h-auto overflow-hidden">
                {(story.is_dynamic || story.before_image_url) ? (
                  <div className="relative w-full h-full flex">
                    <div className="relative w-1/2 h-full overflow-hidden border-r-2 border-white/20">
                      <div className="absolute top-2 left-2 z-20 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-tighter">Initially Reported</div>
                      <img
                        src={story.before_image || story.before_image_url}
                        alt="Before"
                        className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div className="relative w-1/2 h-full overflow-hidden">
                      <div className="absolute top-2 right-2 z-20 bg-green-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-tighter">Current State</div>
                      <img
                        src={story.image || story.image_url}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent lg:bg-gradient-to-r" />
                  </>
                )}

                <div className="absolute bottom-4 left-4 z-20">
                  <Badge className={getStatusColor(story.status)}>
                    {story.status}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold text-foreground">{story.title}</h2>
                      {story.is_dynamic && <Badge variant="secondary" className="text-[10px] bg-blue-100/50 text-blue-700 border-blue-200">Verified System Data</Badge>}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {story.location}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {story.timeframe}</span>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed italic border-l-2 border-ocean-primary/30 pl-4">
                      "{story.description}"
                    </p>
                  </div>

                  {/* Impact Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Droplets className="h-3 w-3 text-ocean-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Water Qual</span>
                      </div>
                      <div className="text-xl font-bold text-ocean-primary">
                        +{story.impact.waterQualityImproved}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Fish className="h-3 w-3 text-success" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Species</span>
                      </div>
                      <div className="text-xl font-bold text-success">
                        {story.impact.speciesRecovered}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-accent" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Lives</span>
                      </div>
                      <div className="text-xl font-bold text-accent">
                        {story.impact.livesImpacted >= 1000 ? (story.impact.livesImpacted / 1000).toFixed(1) + 'k' : story.impact.livesImpacted}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-warning" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Reduced</span>
                      </div>
                      <div className="text-xl font-bold text-warning">
                        -{story.impact.pollutionReduced}%
                      </div>
                    </div>
                  </div>

                  {/* Key Results */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center space-x-2">
                      <span>Core Achievements</span>
                      <div className="h-[1px] flex-1 bg-border" />
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Array.isArray(story.results) && story.results.map((result: string, resultIndex: number) => (
                        <li key={resultIndex} className="flex items-start space-x-2 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mr-2">Partners:</span>
                    {Array.isArray(story.stakeholders) && story.stakeholders.slice(0, 3).map((stakeholder: string, stakeholderIndex: number) => (
                      <Badge key={stakeholderIndex} variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                        {stakeholder}
                      </Badge>
                    ))}
                    {story.stakeholders?.length > 3 && <span className="text-[10px] text-muted-foreground">+{story.stakeholders.length - 3} more</span>}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default SuccessStories;