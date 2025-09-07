git add .
git commit -m "cập nhật label vẽ cho phù hợp với màn hình điện thoại"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master
