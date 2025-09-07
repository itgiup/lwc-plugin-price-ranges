git add .
git commit -m "good"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

