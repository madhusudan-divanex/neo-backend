/lab/staff
/lab/staff/:id
/lab/staff-data/:id
/lab/staff/:id
/lab/professional
/lab/employment
/lab/access
/lab/image
/appointment/lab/:id

Patient->
    Lab Report
    Favorite
    Chat 

Paitent->
    Lab Report 
    Discharge Summary 
    Transfer Document 
Laboratory->
    Welcome 
    Otp 
Hospital->
    Welcome 
    Otp 
    Policy Update
Pharmacy->
    Welcome 
    Otp 
    Expiring Medicines Alert
Doctor->
    New Appointment
    Patient Transfer Request
Admin ->
    Doctor appointments
    Lab appointments
    Dashboard 
    Suppliers
    Patients,Hospital,Lab Edit Request 
    
    Pharmacy (pharma details,medicine request,sell orders)
    Lab (Lab details,appointments)
    Hospital (hospital details,doctors)

Doctor,Pharmacy,Hospital,Laboratory->
    Audit Logs 
Employee Email Template->
    Welcome,Login OTP,Login detected

Audit Log


Website->
    Paitent Card Scan 
    Doctor Card Scan
    Pharmacy Card Scan
    Lab Card Scan
    Hospital Card Scan
    Lab Report Scan
Hospital,Pharmacy,Laboratory,Doctor->
    Paitent Card Scan 

Pharmacy->
    Patient Card Scan
Laboratory->
    Patient Card Scan 
    Paitent 
    Doctor 
    Pharmacy 
    Lab 
    Hospital 

    Paitent 
    Doctor 
    Pharmacy 
    Lab 
    Hospital 


    Paitent 
    Doctor 
    Pharmacy 
    Lab 
    Hospital 
Patient->
    Doctor & Lab Filter 
    Home User search 
    Contct Query 
All Panels->
    Audio & Video Call for individual

Email Template->
Lab->
    Re Test Reqeust
Doctor->
    Paitent Follow up Reminder
Pharmacy->
    Low Stock 
Patient->
    Hospital Invoice 

Flow Pending->
    Pharmacy summary Report 
    Hospital Monthly System Report 
    System Maintenance Notice 
    Doctor Lab Report View 
    Patient Vaccination Reminder 
    Patient Ambulance Service Invocie
    Patient Insurance Claim
Laboratory->
    Chat
Laboratory Api ->
    Get Appointment for lab 
    Add/Get Staff
    Staff employment
    Staff professional
    Staff access 
    Lab images

Doctor->
    Appointment Detail 
    Add/Edit/Delete Prescription 
    Active/Inacitve Prescription 
    Past Appointment 
    Downlaod Prescription
    Prescriptions
    Patient Detail 
    Add Lab Test
    
Patient->
    Downlaod Prescription
    
Admin->
    npm i 
    npm run dev 
Frontend->
    npm i --force 
    npm run start 
Backend->
    npm i 
    npx nodemon

Paitent->
    Change password
    Get Lab Appointment 
    Get Lab test Report 
    Neo Health Card
    Edit Request 
    Update Profile 
    Downlaod Health Card

Pending 
Cancel 
visited
pending-report
     
    Verify Otp 
    Kyc 
    Personal & Demographic Data 
    Medical History 
    Family History 
    Prescription And Reports
    CRD Sell
Pharmacy->
    Manual Sell 
    Generate Bill 

Doctor->     
    Global Call
Patient->
    Global Call
Lab & Pharmacy->
    Staff

All Panel->
    Scanner 
    Filters
    Audit Logs

FeedBack->
    Qr Print
Admin->
    Card Generate
Lab->
    Staff
    



https://neohospital.divanex.in/
madhu13@gmail.com
123456

https://noepatient.divanex.in/
4532656243
1234

Hospital->
    CRUD Permission 
    Doctor employment & access
Laboratory->
    Notification 
    Note option
Patient->
    Notification
    Pharmacy 
Api->
    CRUD Test Category 
    CRUD Patient Banner

Doctor->
    Edit Profile
    Notification
Api->
    Bed Allotment History
    Add/Update Allotment Payment 
    Get Allotment Payment

Hospital->
    Generate Report 
    View Report
    Edit Report 
    Bed Allotment History
    IPD 
    OPD
    Add/Update Allotment Payment
    
    Cms 
    Audio Call 
    Otp Dynamic 
    Ui Set 
    Ai Chat 
    Chat Access
    Notifications


    Profile Management 
    Staff Access

Socket->
    auth: { token}
    call-rejected
    call-busy
    end-call (toUserId)
    reject-call (toUserId)
    answer-call (toUserId,answer)
    typing (toUserId)
    stop-typing (toUserId)
    

Pharmacy->
    Scan sell
    Notification

All Panels->
    Permission base access


    Add Appointment
    CRUD Return 
    CRUD Purchase Order
    Signup,Upload Image,contact person 
    license ,Addresss
    edit request
    change password 
    profile

    public->components->auth->login.jsx

Admin->
    Advertisment (select provider) only on home page accerdian 
    Home page description (text editor)

    Staff 
    Lab 
    Pharmacy 
    Doctor 
    
Api->
    Test Report
    Get Appointment Data
    Get Test Report
    
chart implemention done 

history data pending 

make a google sheet for Laboratory panel what this done in the project which i share to client 
 lab can create account -> Lab Images ->lab Addresss -> Contact Person ->Lab license and certificate 
 change password,forgot password
 user can send edit profile request to admin and after gettting permission user can edit this data (account -> Lab Images ->lab Addresss -> Contact Person ->Lab license and certificate )
 user can add Laboratory permission 
 user can create staff for the Laboratory and grant them permission 
 appointment request were show and user can approve and reject the appointment request 
 user can view patient details 
 user can add test in their Laboratory 
 user add test report the the appointment and generate invoice
flow->
patient website me apna registration process (Personal,kyc,Demographic,Medicalhistory,Family Medicalhistory,Prescription) pura karta ha 
uske baad vo doctor ki listing pe jakar appointment book karta ha date and time daal kar (jo slot availabe ho doctor ke ).
patient lab ki listing pe jakar lab ke appointment bhi  book  karta ha date and time daal kar (jo slot availabe ho doctor ke ).
my appointment me user ke docotor and lab appointments ki list show hoti ha with detail like  appointment details
and Prescription ,lab detail dekh sakta ha 
lab reports tab me patient ki all lab reports aayegi jo usne neo lab panel se ki hogi 
Prescription tab me vo list aayegi jisme Paitent ne neo panel pe appointment book ki hogi 
profile tab me patient ki profile show hoti ha and agar vo edit karna chahe to edit request send karega 
fir admin approve karega fir hi edit kar sakta ha 

chat tab me patient doctor ke sath chat kar sakta ha 

ai chat tab me patient  neo ai se chat kar sakta ha 
change password kar sakta ha 
doctor ka flow 
doctor website me apna registration process (Personal,kyc,About data,Education & work,Medical License) pura karta ha 
fir uske dashboard me kuch information show hoti ha ki aaj kitne appointment ha ,kitne cancel  ho gaye ,pending kitne ha ,
completed appointment kitne ha ,pending request kitni ha patient ki jo approve or reject karni ha 
appointment request tab me jo patient ne appointment book kiya ha but abhi tak docotor ne approve or canecl nhi kiya ha vo aati h 

fir appointment tab me all appointment ki list show hoti ha 
un par click karke vo appointment ki detail dekh sakta ha and appointment me Prescription and lab test add kar sakta ha 

doctor khud bhi appointment create kar sakta ha 
patient history tab me vo sabhi patient aate ha jinhone phele appointment book kiya ho fir un par click karke appointment details
and Prescription ,lab detail dekh sakta ha 
employee tab me docotor staff create kar sakta ha panel ke liye 
Permission TAB me docto staff ko dene wali permission create karega 
profile tab me docotor ki profile show hoti ha and agar vo edit karna chahe to edit request send karega 
fir admin approve karega fir hi edit kar sakta ha 

chat tab me docotor patient ke sath chat kar sakta ha 

ai chat tab me docotor neo ai se chat kar sakta ha 
change password kar sakta ha 

Doctor=>
Regster with phone and email 
Kyc 
Education & Work 
Medical License 
About 
Clinic
Add/Edit Time Slot 
Add/Edit Permission 
Add/Edit Employee with manual data 
Add/Edit Department
Add appointment 
Patient History 
Add Vitals
Add/Edit/Delete Payment 
Notifications
Change Password
Audit Logs
Add /edit Prescription and lab test 
Patient Profle approve and reject
Certificate
    Fitness 
    Medical
    Birth Certificate 
    Death Certificate 
Payment Info
Profile Edit Reqeust
Edit Profile
Neo AI 
Chat
staff login and test below permission
 Add/edit test 
 add/edit prescription 
 appointment status 
 appointment vitals 
 appointment payment
 chat

 Patient->
 Register 
 kyc 
 Personal & Demographic
 Medical History 
 Family Medicalhistory 
 Near by doctor 
 Book/cancel/Rate Doctor Appointment
 Book/cancel/Rate Lab Appointment
 Downlaod Medical Prescription from docotor
 Downlaod Lab report From lab appointment
 Edit Request 
 Update Profile 
 change password
 notifications
 chat 
 neo ai 


 Laboratory->
 Register 
 Lab Image 
 lab address 
 Lab contact person 
 lab License 
 Add Test 
 Edit Test 
 Add Appointment 
 Add Appointment Payment 
 Add Report 
 Edit Report 
 Collect Sample
Add/Edit Time Slot 
Add/Edit Permission 
Add/Edit Employee with id 
Add/Edit Department
 Add Payment Info
 Change Password 
 Audit Logs
 Staff login and test below permission
    Add/edit test 
    add/edit report 
    appointment status 
    Appointment sample
    appointment payment
    chat
 

 
