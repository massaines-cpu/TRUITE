from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True
    dependencies = [

    ]

    operations = [
        migrations.CreateModel(
            name= 'UserProfile',
            fields= [
                ('id', models.BigAutoField(auto_created= True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=100, unique=True)),
                ('password', models.CharField(max_length=255)),
                ('email', models.EmailField(unique=True)),
                ('sex', models.CharField(max_length=20, blank=True, null=True)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('birth_date', models.DateField(blank=True, null=True)),
                ('profile_pic', models.ImageField(upload_to="profiles/", default="profiles/default.png")),


            ],
        ),
    ]