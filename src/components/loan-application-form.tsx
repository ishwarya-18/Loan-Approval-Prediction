"use client";

import React, { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  GraduationCap, 
  Home, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

// Zod schema for form validation
const loanApplicationSchema = z.object({
  // Personal Information
  Gender: z.enum(["Male", "Female"], { required_error: "Please select your gender" }),
  Married: z.enum(["Yes", "No"], { required_error: "Please select marital status" }),
  Dependents: z.enum(["0", "1", "2", "3+"], { required_error: "Please select number of dependents" }),
  
  // Education & Employment
  Education: z.enum(["Graduate", "Not Graduate"], { required_error: "Please select education level" }),
  Self_Employed: z.enum(["Yes", "No"], { required_error: "Please select employment type" }),
  
  // Financial Information
  ApplicantIncome: z.string()
    .min(1, "Income is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid income amount"),
  CoapplicantIncome: z.string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Please enter a valid co-applicant income"),
  LoanAmount: z.string()
    .min(1, "Loan amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid loan amount"),
  Loan_Amount_Term: z.enum(["12", "36", "60", "120", "180", "240", "300", "360", "480"], { required_error: "Please select loan term" }),
  Credit_History: z.enum(["1", "0"], { required_error: "Please select credit history" }),
  Property_Area: z.enum(["Urban", "Semiurban", "Rural"], { required_error: "Please select property area" })
});

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

interface PredictionResponse {
  prediction: "Approved" | "Rejected";
  probability: number;
  reasons?: string[];
}

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Education & Work", icon: GraduationCap },
  { id: 3, title: "Property & Location", icon: Home },
  { id: 4, title: "Financial Details", icon: DollarSign },
  { id: 5, title: "Review & Submit", icon: CheckCircle }
];

export const LoanApplicationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<LoanApplicationData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Calculate form completion percentage
  const completionPercentage = useMemo(() => {
    const totalFields = Object.keys(loanApplicationSchema.shape).length;
    const completedFields = Object.values(formData).filter(value => value && value !== "").length;
    return Math.round((completedFields / totalFields) * 100);
  }, [formData]);

  // Real-time prediction when form data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (completionPercentage >= 70) {
        updatePrediction();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, completionPercentage]);

  const updateFormData = (field: keyof LoanApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const stepFields: Record<number, (keyof LoanApplicationData)[]> = {
      1: ["Gender", "Married", "Dependents"],
      2: ["Education", "Self_Employed"],
      3: ["Property_Area"],
      4: ["ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term", "Credit_History"]
    };

    const fieldsToValidate = stepFields[step] || [];
    const newErrors: Record<string, string> = {};

    fieldsToValidate.forEach(field => {
      try {
        loanApplicationSchema.shape[field].parse(formData[field]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[field] = error.errors[0].message;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePrediction = async () => {
    if (!formData.ApplicantIncome || !formData.LoanAmount) return;

    setIsLoadingPrediction(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Gender: formData.Gender || "Male",
          Married: formData.Married || "No",
          Dependents: formData.Dependents || "0",
          Education: formData.Education || "Graduate",
          Self_Employed: formData.Self_Employed || "No",
          ApplicantIncome: Number(formData.ApplicantIncome),
          CoapplicantIncome: Number(formData.CoapplicantIncome) || 0,
          LoanAmount: Number(formData.LoanAmount),
          Loan_Amount_Term: Number(formData.Loan_Amount_Term) || 360,
          Credit_History: Number(formData.Credit_History) || 1,
          Property_Area: formData.Property_Area || "Urban"
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPrediction(result);
      }
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      const validatedData = loanApplicationSchema.parse(formData);
      setIsSubmitting(true);
      setSubmitError("");

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      const result = await response.json();
      setSubmitSuccess(true);
      
      // Update prediction with final result
      if (result.prediction) {
        setPrediction(result.prediction);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        setCurrentStep(1); // Go back to first step with errors
      } else {
        setSubmitError("An error occurred while submitting your application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <RadioGroup
                value={formData.Gender || ""}
                onValueChange={(value) => updateFormData("Gender", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
              {errors.Gender && <p className="text-sm text-destructive">{errors.Gender}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="married">Marital Status *</Label>
              <RadioGroup
                value={formData.Married || ""}
                onValueChange={(value) => updateFormData("Married", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="married-yes" />
                  <Label htmlFor="married-yes">Married</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="married-no" />
                  <Label htmlFor="married-no">Single</Label>
                </div>
              </RadioGroup>
              {errors.Married && <p className="text-sm text-destructive">{errors.Married}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependents">Number of Dependents *</Label>
              <Select value={formData.Dependents || ""} onValueChange={(value) => updateFormData("Dependents", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of dependents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3+">3+</SelectItem>
                </SelectContent>
              </Select>
              {errors.Dependents && <p className="text-sm text-destructive">{errors.Dependents}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="education">Education Level *</Label>
              <RadioGroup
                value={formData.Education || ""}
                onValueChange={(value) => updateFormData("Education", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Graduate" id="graduate" />
                  <Label htmlFor="graduate">Graduate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Graduate" id="not-graduate" />
                  <Label htmlFor="not-graduate">Not Graduate</Label>
                </div>
              </RadioGroup>
              {errors.Education && <p className="text-sm text-destructive">{errors.Education}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-employed">Employment Type *</Label>
              <RadioGroup
                value={formData.Self_Employed || ""}
                onValueChange={(value) => updateFormData("Self_Employed", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="employed" />
                  <Label htmlFor="employed">Employed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="self-employed" />
                  <Label htmlFor="self-employed">Self-Employed</Label>
                </div>
              </RadioGroup>
              {errors.Self_Employed && <p className="text-sm text-destructive">{errors.Self_Employed}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property-area">Property Area *</Label>
              <Select value={formData.Property_Area || ""} onValueChange={(value) => updateFormData("Property_Area", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urban">Urban</SelectItem>
                  <SelectItem value="Semiurban">Semi-Urban</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                </SelectContent>
              </Select>
              {errors.Property_Area && <p className="text-sm text-destructive">{errors.Property_Area}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant-income">Your Monthly Income ($) *</Label>
                <Input
                  id="applicant-income"
                  type="number"
                  value={formData.ApplicantIncome || ""}
                  onChange={(e) => updateFormData("ApplicantIncome", e.target.value)}
                  placeholder="e.g., 5000"
                />
                {errors.ApplicantIncome && <p className="text-sm text-destructive">{errors.ApplicantIncome}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coapplicant-income">Co-applicant Monthly Income ($)</Label>
                <Input
                  id="coapplicant-income"
                  type="number"
                  value={formData.CoapplicantIncome || ""}
                  onChange={(e) => updateFormData("CoapplicantIncome", e.target.value)}
                  placeholder="e.g., 0"
                />
                {errors.CoapplicantIncome && <p className="text-sm text-destructive">{errors.CoapplicantIncome}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount ($) *</Label>
              <Input
                id="loan-amount"
                type="number"
                value={formData.LoanAmount || ""}
                onChange={(e) => updateFormData("LoanAmount", e.target.value)}
                placeholder="e.g., 150000"
              />
              {errors.LoanAmount && <p className="text-sm text-destructive">{errors.LoanAmount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (months) *</Label>
              <Select value={formData.Loan_Amount_Term || ""} onValueChange={(value) => updateFormData("Loan_Amount_Term", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="36">36 months (3 years)</SelectItem>
                  <SelectItem value="60">60 months (5 years)</SelectItem>
                  <SelectItem value="120">120 months (10 years)</SelectItem>
                  <SelectItem value="180">180 months (15 years)</SelectItem>
                  <SelectItem value="240">240 months (20 years)</SelectItem>
                  <SelectItem value="300">300 months (25 years)</SelectItem>
                  <SelectItem value="360">360 months (30 years)</SelectItem>
                  <SelectItem value="480">480 months (40 years)</SelectItem>
                </SelectContent>
              </Select>
              {errors.Loan_Amount_Term && <p className="text-sm text-destructive">{errors.Loan_Amount_Term}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-history">Credit History *</Label>
              <RadioGroup
                value={formData.Credit_History || ""}
                onValueChange={(value) => updateFormData("Credit_History", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="credit-good" />
                  <Label htmlFor="credit-good">Good credit history</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="credit-poor" />
                  <Label htmlFor="credit-poor">Poor credit history</Label>
                </div>
              </RadioGroup>
              {errors.Credit_History && <p className="text-sm text-destructive">{errors.Credit_History}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Gender:</strong> {formData.Gender}</div>
              <div><strong>Marital Status:</strong> {formData.Married}</div>
              <div><strong>Dependents:</strong> {formData.Dependents}</div>
              <div><strong>Education:</strong> {formData.Education}</div>
              <div><strong>Employment:</strong> {formData.Self_Employed === "Yes" ? "Self-Employed" : "Employed"}</div>
              <div><strong>Property Area:</strong> {formData.Property_Area}</div>
              <div><strong>Your Income:</strong> ${Number(formData.ApplicantIncome || 0).toLocaleString()}</div>
              <div><strong>Co-applicant Income:</strong> ${Number(formData.CoapplicantIncome || 0).toLocaleString()}</div>
              <div><strong>Loan Amount:</strong> ${Number(formData.LoanAmount || 0).toLocaleString()}</div>
              <div><strong>Loan Term:</strong> {formData.Loan_Amount_Term} months</div>
              <div><strong>Credit History:</strong> {formData.Credit_History === "1" ? "Good" : "Poor"}</div>
            </div>

            {submitError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {submitSuccess && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your loan application has been submitted successfully! You will receive a confirmation email shortly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getPredictionIcon = () => {
    if (!prediction) return <Minus className="h-5 w-5 text-muted-foreground" />;
    return prediction.prediction === "Approved" ? 
      <TrendingUp className="h-5 w-5 text-green-600" /> : 
      <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const getPredictionColor = () => {
    if (!prediction) return "bg-gray-50 border-gray-200";
    return prediction.prediction === "Approved" ? 
      "bg-green-50 border-green-200" : 
      "bg-red-50 border-red-200";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Loan Application</CardTitle>
          <CardDescription>
            Complete your application step by step. We'll provide real-time predictions as you progress.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}% complete</span>
          </div>
          <Progress value={completionPercentage} className="mb-4" />
          
          {/* Step Indicators */}
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={`
                    p-2 rounded-full border-2 transition-all
                    ${isActive ? "border-primary bg-primary text-primary-foreground" :
                      isCompleted ? "border-green-500 bg-green-500 text-white" :
                      "border-muted-foreground bg-background text-muted-foreground"}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs text-center ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
                Step {currentStep}: {STEPS[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
              
              <Separator className="my-6" />
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < 5 ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || submitSuccess}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Panel */}
        <div className="space-y-4">
          <Card className={`${getPredictionColor()} transition-all duration-300`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getPredictionIcon()}
                Loan Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPrediction ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Calculating...</span>
                </div>
              ) : prediction ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={
                      prediction.prediction === "Approved" ? 
                      "bg-green-100 text-green-800 hover:bg-green-100" : 
                      "bg-red-100 text-red-800 hover:bg-red-100"
                    }>
                      {prediction.prediction}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Confidence:</span>
                    <span className="text-sm">
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={prediction.probability * 100} 
                    className="h-2"
                  />
                  {prediction.reasons && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Key factors:</p>
                      <ul className="text-xs space-y-1">
                        {prediction.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-muted-foreground">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete more fields to see your loan prediction
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {formData.ApplicantIncome && formData.LoanAmount && (
                  <>
                    <div className="flex justify-between">
                      <span>Total Income:</span>
                      <span className="font-medium">
                        ${(Number(formData.ApplicantIncome) + Number(formData.CoapplicantIncome || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan to Income:</span>
                      <span className="font-medium">
                        {((Number(formData.LoanAmount) / (Number(formData.ApplicantIncome) + Number(formData.CoapplicantIncome || 0))) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
                {formData.LoanAmount && formData.Loan_Amount_Term && (
                  <div className="flex justify-between">
                    <span>Monthly Payment:</span>
                    <span className="font-medium">
                      ${Math.round(Number(formData.LoanAmount) / Number(formData.Loan_Amount_Term || 360)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};