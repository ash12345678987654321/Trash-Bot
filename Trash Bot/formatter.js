let r,c; //global var
let grid;

module.exports = function (_grid,_r,_c){
    //firstly parses 0-255 to a float in [0,1] and filters out bg and random shadows
    //then we need to get a bounding box for the number
    //then we scale the bounding box to 20x20
    //then we transform the bounding box such that center of mass is centered in a 28x28 grid

    grid=_grid,r=_r,c=_c;

    let avg_val=0;

    for (let x = 0; x < r; x++) {
        for (let y = 0; y < c; y++) {
            avg_val+=grid[x][y];
        }
    }

    avg_val/=r*c;

    for (let x = 0; x < r; x++) {
        for (let y = 0; y < c; y++) {
            if (grid[x][y]>avg_val*0.9) grid[x][y]=0.0;
            else grid[x][y]=scale(grid[x][y]);
        }
    }

    for (let i=0;i<r;i++){
        dfs(i,0,grid[i][0]);
        dfs(i,c-1,grid[i][c-1]);
    }

    for (let i=0;i<c;i++){
        dfs(0,i,grid[0][i]);
        dfs(r-1,i,grid[r-1][i]);
    }

    let min_x=r,max_x=0; //bounding box
    let min_y=c,max_y=0; //more bounding box

    for (let x = 0; x < r; x++) {
        for (let y = 0; y < c; y++) {
            if (grid[x][y]!==0.0){
                min_x=Math.min(x,min_x);
                max_x=Math.max(x,max_x);
                min_y=Math.min(y,min_y);
                max_y=Math.max(y,max_y);
            }
        }
    }

    let bound_length=Math.max(max_x-min_x,max_y-min_y,1); //1 is cornercase in case thing is somehow blank
    let bound=new Array(bound_length);
    for (let x=0;x<bound_length;x++){
        bound[x]=new Array(bound_length);
        for (let y=0;y<bound_length;y++) {
            if (x+min_x<r && y+min_y<c) bound[x][y]=grid[x+min_x][y+min_y];
            else bound[x][y]=0.0;
        }
    }

    //now we need to sqiush bound to 20x20 array
    //this is going to be stupid but just simply make alot of copies of the array
    let squished=new Array(20);
    for (let x=0;x<20;x++) squished[x]=new Array(20).fill(0);
    for (let x=0;x<20*bound_length;x++){
        for (let y=0;y<20*bound_length;y++){
            squished[~~(x/bound_length)][~~(y/bound_length)]+=bound[~~(x/20)][~~(y/20)]; //integer division is actually gay here
        }
    }

    let x_avg=0.0,y_avg=0.0; //this is the center of mass
    let total_mass=0.0; //total_mass to help calc center of mass
    for (let x=0;x<20;x++){
        for (let y=0;y<20;y++){
            squished[x][y]/=(bound_length*bound_length);

            x_avg+=x*squished[x][y];
            y_avg+=y*squished[x][y];
            total_mass+=squished[x][y];
        }
    }

    x_avg/=total_mass;
    y_avg/=total_mass;

    let x_start=14-x_avg; //so this should be the place where the start of the thing is
    let y_start=14-y_avg;

    let x_start_int=Math.floor(x_start);
    let x_start_dec=x_start-x_start_int;
    let y_start_int=Math.floor(y_start);
    let y_start_dec=y_start-y_start_int;

    console.log(x_start,y_start);
    console.log(x_start_int,x_start_dec);
    console.log(y_start_int,y_start_dec);

    let result=new Array(28);
    for (let x=0;x<28;x++) result[x]=new Array(28).fill(0);

    for (let x=0;x<20;x++){
        for (let y=0;y<20;y++){
            if (valid(x+x_start_int,y+y_start_int)) result[x+x_start_int][y+y_start_int]+=squished[x][y]*(1-x_start_dec)*(1-y_start_dec);
            if (valid(x+x_start_int+1,y+y_start_int)) result[x+x_start_int+1][y+y_start_int]+=squished[x][y]*(x_start_dec)*(1-y_start_dec);
            if (valid(x+x_start_int,y+y_start_int+1)) result[x+x_start_int][y+y_start_int+1]+=squished[x][y]*(1-x_start_dec)*(y_start_dec);
            if (valid(x+x_start_int+1,y+y_start_int+1)) result[x+x_start_int+1][y+y_start_int+1]+=squished[x][y]*(x_start_dec)*(y_start_dec);
        }
    }

    return result;
};

function dfs(x,y,prev){ //removes marks from borders
    if (x<0 || r<=x || y<0 || c<=y) return;
    if (grid[x][y]===0.0 || Math.abs(grid[x][y]-prev)>0.1) return;

    const curr=grid[x][y];
    grid[x][y]=0.0;

    dfs(x-1,y,curr);
    dfs(x+1,y,curr);
    dfs(x,y-1,curr);
    dfs(x,y+1,curr);
}

function valid(i,j){
    return (0<=i && i<28 && 0<=j && j<28);
}

//random helper functions
function scale(intensity){ //this should return an integer
    return sigmoid((150-intensity)/20);
}

function sigmoid(i){
    return 1.0/(1.0+Math.exp(-i));
}