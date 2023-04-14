import json, os, pandas as pd
from flask import Flask, request, render_template, redirect, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from yolov7model import get_yolov7, predict, base64_to_image, image_to_base64
import smtplib, ssl
from email.message import EmailMessage

app = Flask(__name__)
model = get_yolov7()
db_path = os.path.join(os.path.dirname(__file__), 'detectAnimal.db')
db_uri = 'sqlite:///{}'.format(db_path)
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = "phoenixshri1234"
db = SQLAlchemy(app)



class DetectAnimals(db.Model):
    sno = db.Column(db.Integer, primary_key=True)
    animal_name = db.Column(db.String(20), nullable=False)
    date_of_detection = db.Column(db.String(20), nullable=False, default=datetime.now().strftime('%d-%m-%Y'))
    time_of_detection = db.Column(db.String(20), nullable=False, default=datetime.now().strftime('%H:%M:%S'))
    def __repr__(self) -> str:
        return f"{self.sno} - {self.animal_name}"
    
class User(db.Model):
    sno = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False)
    password = db.Column(db.String(20), nullable=False)
    def __repr__(self) -> str:
        return f"{self.sno} - {self.name}"
    
with app.app_context():
    db.create_all()



def addtodb(animalList):
    if len(animalList) == 0 or animalList[0] == "person":
        return
    lastRec = DetectAnimals.query.order_by(DetectAnimals.sno.desc()).first()
    if lastRec != None and lastRec.animal_name == animalList[0]:
        currDateTime = datetime.now().strftime('%d-%m-%Y %H:%M:%S')
        prevDateTime = lastRec.date_of_detection + " " + lastRec.time_of_detection
        myformat = "%d-%m-%Y %H:%M:%S"
        curr = datetime.strptime(currDateTime, myformat)
        prev = datetime.strptime(prevDateTime, myformat)
        diff = curr - prev
        diffDays = diff.days
        diffmins = diff.seconds // 60
        if not (diffDays > 0 or diffmins > 1):
            return
    date_of_detection = datetime.now().strftime('%d-%m-%Y')
    time_of_detection = datetime.now().strftime('%H:%M:%S')
    animal = DetectAnimals(animal_name = animalList[0], date_of_detection = date_of_detection, time_of_detection = time_of_detection)
    db.session.add(animal)
    db.session.commit()
    message = animalList[0] + " is detected on " + date_of_detection + " at " + time_of_detection
    sendMail(message)



emailSender = "shrinathkorajkar@gmail.com"
passwordSender = "wmhtjeqacuvuoqcg"
emailReceiver = ["shrinathkorajkar@gmail.com", "rathodtejashwini46@gmail.com", "shriramhebbar47@gmail.com", "prathameshc656@gmail.com"]
email = EmailMessage()
email['From'] = emailSender
email['To'] = ", ".join(emailReceiver)
email['Subject'] = "Animal Detected"
def sendMail(body):
    email.set_content(body)
    context = ssl._create_unverified_context()
    with smtplib.SMTP_SSL("64.233.184.108", 465, context=context) as smtpserver:
        smtpserver.login(emailSender, passwordSender)
        smtpserver.sendmail(emailSender, emailReceiver, email.as_string())



@app.route('/')
def index():
    flag = "none"
    if session.get('flag'):
        flag = session['flag']
    session.clear()
    return render_template('index.html', flag=flag)


@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/detect')
def detect():
    return render_template('detect.html')


@app.route('/signIn', methods=['POST'])
def signIn():
    username = request.form['signInUsername']
    password = request.form['signInPassword']
    exists = db.session.query(User.sno).filter_by(name=username, password=password).first() is not None
    if(exists):
        session['flag'] = "exists"
        return redirect('/')
    user = User(name=username, password=password)
    db.session.add(user)
    db.session.commit()
    session['flag'] = "signSuccess"
    return redirect('/')
    


@app.route('/logIn', methods=['POST'])
def logIn():
    username = request.form['loginUsername']
    password = request.form['loginPassword']
    exists = db.session.query(User.sno).filter_by(name=username, password=password).first() is not None
    if(exists):
        user = User.query.filter_by(name=username, password=password).first()
        session['username'] = user.name
        return redirect('/home')
    session['flag'] = "loginFail"
    return redirect('/')



@app.route('/saveReport', methods=['POST'])
def saveReport():
    base = os.path.dirname(os.path.abspath(__file__))
    data = request.json
    df = pd.DataFrame(data)
    with pd.ExcelWriter(base + '/static/assets/report.xlsx', mode='w') as writer:
        df.to_excel(writer, index=False)
    return {'message': 'Data saved successfully'}, 200


@app.route('/viewreport')
def viewreport():
    allAnimals = DetectAnimals.query.all()
    return render_template('viewreport.html', report=allAnimals)


@app.route('/delete/<int:sno>')
def delete(sno):
    animal = DetectAnimals.query.filter_by(sno=sno).first()
    db.session.delete(animal)
    db.session.commit()
    return redirect("/viewreport")


@app.route('/deleteAll')
def deleteAllRecords():
    DetectAnimals.query.delete()
    db.session.commit()
    return redirect('/viewreport')



@app.route('/detectImg', methods=['POST'])
def detectImg():
    jsonObj = json.loads(request.get_data().decode('UTF-8'))
    base64Image = jsonObj['image']
    image = base64_to_image(base64Image)
    (predictedImage, detectedList) = predict(model, image)
    base64Image = image_to_base64(predictedImage)
    jsonObj['image'] = base64Image
    jsonObj['detectedList'] = detectedList
    addtodb(detectedList)
    return jsonObj


if __name__ == '__main__':
    app.run(debug=True, port=8000)
    # app.run(debug=False, port=8000, host='0.0.0.0')