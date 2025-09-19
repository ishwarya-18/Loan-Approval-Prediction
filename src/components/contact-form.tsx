"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Building,
  Users,
  HeadphonesIcon,
  Handshake,
  Loader2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react'

interface FormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  contactMethod: string
  bestTime: string
  file?: File
  privacyAgreed: boolean
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  contactMethod?: string
  bestTime?: string
  privacyAgreed?: string
}

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactMethod: '',
    bestTime: '',
    privacyAgreed: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [messageLength, setMessageLength] = useState(0)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long'
    }

    if (!formData.contactMethod) {
      newErrors.contactMethod = 'Please select a preferred contact method'
    }

    if (!formData.bestTime) {
      newErrors.bestTime = 'Please select your preferred contact time'
    }

    if (!formData.privacyAgreed) {
      newErrors.privacyAgreed = 'You must agree to the privacy policy'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone', formatted)
  }

  const handleMessageChange = (value: string) => {
    if (value.length <= 1000) {
      setMessageLength(value.length)
      handleInputChange('message', value)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="bg-surface border-border">
            <CardContent className="pt-16 pb-12 text-center">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Thank You for Your Message</h2>
                <p className="text-muted-foreground">We've received your inquiry and will respond within 24 hours.</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Our team will review your message and any attached documents</li>
                  <li>• You'll receive a confirmation email with a reference number</li>
                  <li>• A specialist will contact you via your preferred method within 24 hours</li>
                  <li>• For urgent matters, please call our main number directly</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                    contactMethod: '',
                    bestTime: '',
                    privacyAgreed: false
                  })
                  setMessageLength(0)
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Send Another Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Get In Touch</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about our financial services? We're here to help you make informed decisions about your financial future.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Send Us a Message</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`mt-1 bg-surface border-input ${errors.fullName ? 'border-destructive' : ''}`}
                      placeholder="John Smith"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1 bg-surface border-input ${errors.email ? 'border-destructive' : ''}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="mt-1 bg-surface border-input"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-foreground">Subject *</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => handleInputChange('subject', value)}
                  >
                    <SelectTrigger className={`mt-1 bg-surface border-input ${errors.subject ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select an inquiry type" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="loans">Loan Questions</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message" className="text-foreground">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    className={`mt-1 bg-surface border-input min-h-[120px] resize-y ${errors.message ? 'border-destructive' : ''}`}
                    placeholder="Please describe your inquiry or question..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground ml-auto">
                      {messageLength}/1000 characters
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactMethod" className="text-foreground">Preferred Contact Method *</Label>
                    <Select 
                      value={formData.contactMethod} 
                      onValueChange={(value) => handleInputChange('contactMethod', value)}
                    >
                      <SelectTrigger className={`mt-1 bg-surface border-input ${errors.contactMethod ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-border">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="both">Both Email and Phone</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.contactMethod && (
                      <p className="text-sm text-destructive mt-1">{errors.contactMethod}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="bestTime" className="text-foreground">Best Time to Contact *</Label>
                    <Select 
                      value={formData.bestTime} 
                      onValueChange={(value) => handleInputChange('bestTime', value)}
                    >
                      <SelectTrigger className={`mt-1 bg-surface border-input ${errors.bestTime ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-border">
                        <SelectItem value="morning">Morning (9am - 12pm)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                        <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                        <SelectItem value="anytime">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bestTime && (
                      <p className="text-sm text-destructive mt-1">{errors.bestTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="file" className="text-foreground">Attach Documents (Optional)</Label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <Label
                      htmlFor="file"
                      className="flex items-center px-4 py-2 bg-surface border border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.file ? formData.file.name : 'Choose file'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (max 5MB)
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAgreed}
                    onCheckedChange={(checked) => handleInputChange('privacyAgreed', checked as boolean)}
                    className={errors.privacyAgreed ? 'border-destructive' : ''}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="privacy"
                      className="text-sm font-normal text-foreground cursor-pointer"
                    >
                      I agree to the privacy policy and terms of service *
                    </Label>
                    {errors.privacyAgreed && (
                      <p className="text-sm text-destructive">{errors.privacyAgreed}</p>
                    )}
                  </div>
                </div>

                <Alert className="bg-muted/50 border-muted">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-muted-foreground">
                    Your information is protected by enterprise-grade security. We use advanced anti-spam protection and never share your data with third parties.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Main Office</h4>
                    <p className="text-muted-foreground">123 Financial District</p>
                    <p className="text-muted-foreground">New York, NY 10004</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Phone Numbers</h4>
                    <p className="text-muted-foreground">Main: (555) 123-4567</p>
                    <p className="text-muted-foreground">Loans: (555) 123-4568</p>
                    <p className="text-muted-foreground">Support: (555) 123-4569</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Email Addresses</h4>
                    <p className="text-muted-foreground">info@company.com</p>
                    <p className="text-muted-foreground">loans@company.com</p>
                    <p className="text-muted-foreground">support@company.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Business Hours</h4>
                    <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-muted-foreground">Saturday: 9:00 AM - 3:00 PM</p>
                    <p className="text-muted-foreground">Sunday: Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Department Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-secondary" />
                  <div>
                    <h4 className="font-semibold text-foreground">General Inquiries</h4>
                    <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-secondary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Loan Department</h4>
                    <p className="text-sm text-muted-foreground">(555) 123-4568</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <HeadphonesIcon className="h-5 w-5 text-secondary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Technical Support</h4>
                    <p className="text-sm text-muted-foreground">(555) 123-4569</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Handshake className="h-5 w-5 text-secondary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Partnerships</h4>
                    <p className="text-sm text-muted-foreground">(555) 123-4570</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    For urgent financial matters outside business hours, call our 24/7 emergency line: <strong>(555) 911-HELP</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    <Linkedin className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    <Instagram className="h-6 w-6" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactForm