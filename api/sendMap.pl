#!/usr/bin/perl -w
use CGI;
use Data::Dumper;
use DBI;
open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $q = CGI->new;
my $data = $q->param('POSTDATA');
if(!defined($data)) { $data = $q->param('XForms:Model'); }
print $q->header('text/plain');
print "Looks like you sent: $data\n";

# This data should be in the form: 
# UserID: X
# Coords: XX,XX

my @lines = split(/^/,$data);
my $userID = 0;
my $xpos = 0;
my $ypos = 0;
for my $l(@lines) {
    if($l=~/^UserID: (\d+)/) {
        $userID = $1;
    }
    elsif($l=~/Coords: (\d+),(\d+)/) {
        $xpos = $1;
        $ypos = $2;
    }
}

sub getUserShard
{
    my $userID = shift;
    $sth = $dbh->prepare("SELECT shard FROM userids where userid=?");
    $rh = $sth->execute($userID);
    my @array=$sth->fetchrow_array();
    return $array[0];
}

sub getOldShardTime
{
    my $shardID = shift;    
    $sth = $dbh->prepare("SELECT time FROM shard where shardid=?");
    $rh = $sth->execute($shardID);
    my @array=$sth->fetchrow_array();
    return $array[0];
}

my $shardID = getUserShard($userID);
print "Shard ID of user $userID is $shardID\n";
my $time = getOldShardTime($shardID);
$time += 10;
print "Updating shard $shardID time to $time\n";
# Set shard not in use
my $sth = $dbh->prepare("UPDATE shard set inuse=0, playerx=?, playery=?, time=? WHERE shardid=?");
my $rh = $sth->execute($xpos,$ypos,$time,$shardID);

# Now get the next player.
$sth = $dbh->prepare("SELECT userid FROM userids where shard=? AND userid>? ORDER BY userid ASC LIMIT 1");
$rh = $sth->execute($shardID, $userID);
my @array = $sth->fetchrow_array();
my $nextUserID=0;
if(@array > 0) {
    $nextUserID = $array[0];
    print "Next user ID is next highest up, $nextUserID\n";
}
else
{
    $sth = $dbh->prepare("SELECT userid FROM userids where shard=? ORDER BY userid ASC;");
    $rh = $sth->execute($shardID);
    my @array = $sth->fetchrow_array();
    if(@array > 0) {
        $nextUserID = $array[0];
        print "Next user ID is lowest, $nextUserID\n";
    } else {
        print "User ID query returned nothing!\n";
    }
}

# This is duplicated in login.pl!
sub setShardUser
{
    my($shardID, $userID) = @_;
    my $sth = $dbh->prepare("UPDATE shard SET nextuser=? WHERE shardid=?");
    my $rh = $sth->execute($userID,$shardID);
    print "Next user of shard $shardID has been set to $userID\n";
}

# Now update it
setShardUser($shardID, $nextUserID);

# Job done
